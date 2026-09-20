import "@tanstack/react-start/server-only";

import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import type { LLMModel } from "@/lib/api";
import {
  MODELS_KEYS,
  MODELS_TTL_SECONDS,
  MODELS_WRITE_KEY,
} from "@/lib/models-cache-keys";

import { redisCommand } from "@/lib/redis-cache";

interface ModelsCacheEntry {
  key: string;
  models: LLMModel[];
  refreshedAt: number; // ms epoch
  stats?: Record<string, number>;
}

export interface ModelsCacheSummary {
  cacheFile: string;
  exists: boolean;
  valid: boolean;
  fresh: boolean;
  key?: string;
  count?: number;
  refreshedAt?: string;
  refreshedAtMs?: number;
  ageSeconds?: number;
  stats?: Record<string, number>;
  error?: string;
}

const DEFAULT_CACHE_FILE = ".data/models-cache.json";

function getCacheFilePath(): string {
  return path.resolve(
    process.cwd(),
    process.env.MODELS_CACHE_FILE || DEFAULT_CACHE_FILE,
  );
}

function isValidEntry(raw: unknown): raw is ModelsCacheEntry {
  if (!raw || typeof raw !== "object") return false;
  const entry = raw as Partial<ModelsCacheEntry>;
  return (
    typeof entry.key === "string" &&
    MODELS_KEYS.includes(entry.key as (typeof MODELS_KEYS)[number]) &&
    Array.isArray(entry.models) &&
    entry.models.length > 0 &&
    typeof entry.refreshedAt === "number" &&
    Number.isFinite(entry.refreshedAt) &&
    entry.refreshedAt > 0 &&
    entry.refreshedAt <= Date.now() + 60_000
  );
}

function isFresh(entry: ModelsCacheEntry): boolean {
  return entry.refreshedAt + MODELS_TTL_SECONDS * 1000 > Date.now();
}

const REDIS_KEY = "benchsift:catalogue:shared:v1";
let fileSnapshot:
  | { path: string; signature: string; digest: string; entry: ModelsCacheEntry }
  | undefined;
let sharedSnapshot: ModelsCacheEntry | null = null;
let sharedDigest: string | null = null;
let nextSharedCheck = 0;
let reading: Promise<ModelsCacheEntry | null> | undefined;

function digest(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

function parseEntry(raw: string): ModelsCacheEntry | null {
  try {
    const entry: unknown = JSON.parse(raw);
    return isValidEntry(entry) ? entry : null;
  } catch {
    return null;
  }
}

async function readSnapshot(): Promise<ModelsCacheEntry | null> {
  // stat detects atomic replacements by other workers without reparsing JSON.
  let local: ModelsCacheEntry | null = null;
  const file = getCacheFilePath();
  try {
    const info = await stat(file);
    const signature = `${info.ino}:${info.mtimeMs}:${info.size}`;
    if (fileSnapshot?.path === file && fileSnapshot.signature === signature)
      local = fileSnapshot.entry;
    else {
      const raw = await readFile(file, "utf8");
      const hash = digest(raw);
      local = hash === sharedDigest ? sharedSnapshot : parseEntry(raw);
      fileSnapshot = local ? { path: file, signature, digest: hash, entry: local } : undefined;
    }
  } catch {
    fileSnapshot = undefined;
    /* First boot or unavailable disk: Redis can still serve the catalogue. */
  }
  if (process.env.REDIS_URL && Date.now() >= nextSharedCheck) {
    const raw = await redisCommand("GET", [REDIS_KEY]);
    if (typeof raw === "string") {
      const hash = digest(raw);
      if (hash !== sharedDigest) {
        const parsed = hash === fileSnapshot?.digest ? fileSnapshot.entry : parseEntry(raw);
        if (parsed) {
          sharedSnapshot = parsed;
          sharedDigest = hash;
        }
      }
    }
    nextSharedCheck = Date.now() + 5_000;
  }
  const shared = process.env.REDIS_URL ? sharedSnapshot : null;
  return shared && (!local || shared.refreshedAt > local.refreshedAt)
    ? shared
    : local;
}

export async function readModelsCache(
  options: { allowStale?: boolean } = {},
): Promise<ModelsCacheEntry | null> {
  reading ??= readSnapshot().finally(() => {
    reading = undefined;
  });
  const entry = await reading;
  return entry && (options.allowStale || isFresh(entry)) ? entry : null;
}

export async function readModelsCacheSummary(): Promise<ModelsCacheSummary> {
  const cacheFile = getCacheFilePath();
  try {
    const parsed = await readModelsCache({ allowStale: true });
    if (!parsed) {
      const exists = await stat(cacheFile).then(
        () => true,
        () => false,
      );
      return { cacheFile, exists, valid: false, fresh: false };
    }

    const now = Date.now();
    return {
      cacheFile,
      exists: true,
      valid: true,
      fresh: isFresh(parsed),
      key: parsed.key,
      count: parsed.models.length,
      refreshedAt: new Date(parsed.refreshedAt).toISOString(),
      refreshedAtMs: parsed.refreshedAt,
      ageSeconds: Math.max(0, Math.round((now - parsed.refreshedAt) / 1000)),
      stats: parsed.stats,
    };
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String((error as { code?: unknown }).code)
        : undefined;
    return {
      cacheFile,
      exists: false,
      valid: false,
      fresh: false,
      error: code === "ENOENT" ? "Cache file does not exist" : String(error),
    };
  }
}

export async function writeModelsCache(
  models: LLMModel[],
  stats?: Record<string, number>,
): Promise<void> {
  const cacheFile = getCacheFilePath();
  const temporaryFile = `${cacheFile}.${process.pid}.${randomUUID()}.tmp`;
  const entry: ModelsCacheEntry = {
    key: MODELS_WRITE_KEY,
    models,
    refreshedAt: Date.now(),
    ...(stats ? { stats } : {}),
  };
  if (!isValidEntry(entry))
    throw new Error("Refusing invalid or empty catalogue");
  const serialized = JSON.stringify(entry);
  await mkdir(path.dirname(cacheFile), { recursive: true });
  try {
    await writeFile(temporaryFile, serialized, "utf8");
    const info = await stat(temporaryFile);
    await rename(temporaryFile, cacheFile);
    const hash = digest(serialized);
    fileSnapshot = {
      path: cacheFile,
      signature: `${info.ino}:${info.mtimeMs}:${info.size}`,
      digest: hash,
      entry,
    };
    // Persist to disk first. Redis is an optional shared accelerator, never the
    // only durable copy. Retain stale data through outages (30-day Redis TTL).
    await redisCommand("SET", [REDIS_KEY, serialized, "EX", "2592000"]);
    sharedSnapshot = process.env.REDIS_URL ? entry : null;
    sharedDigest = process.env.REDIS_URL ? hash : null;
    nextSharedCheck = 0;
  } catch (error) {
    await rm(temporaryFile, { force: true }).catch(() => undefined);
    throw error;
  }
}

/**
 * Best-effort background write. This keeps the first successful cold request
 * useful for later requests even before an external scheduler calls refresh.
 */
export function scheduleWriteModelsCache(models: LLMModel[]): void {
  void writeModelsCache(models).catch(() => {
    // Best-effort - the next refresh call can repopulate the cache.
  });
}
