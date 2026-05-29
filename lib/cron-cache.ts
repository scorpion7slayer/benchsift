import "@tanstack/react-start/server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { LLMModel } from "@/lib/api";
import {
  MODELS_TTL_SECONDS,
  MODELS_WRITE_KEY,
} from "@/lib/models-cache-keys";

interface ModelsCacheEntry {
  key: string;
  models: LLMModel[];
  refreshedAt: number; // ms epoch
}

const DEFAULT_CACHE_FILE = ".data/models-cache.json";

function getCacheFilePath(): string {
  return path.resolve(process.cwd(), process.env.MODELS_CACHE_FILE || DEFAULT_CACHE_FILE);
}

function isValidEntry(raw: unknown): raw is ModelsCacheEntry {
  if (!raw || typeof raw !== "object") return false;
  const entry = raw as Partial<ModelsCacheEntry>;
  return (
    entry.key === MODELS_WRITE_KEY &&
    Array.isArray(entry.models) &&
    entry.models.length > 0 &&
    typeof entry.refreshedAt === "number"
  );
}

function isFresh(entry: ModelsCacheEntry): boolean {
  return entry.refreshedAt + MODELS_TTL_SECONDS * 1000 > Date.now();
}

export async function readModelsCache(): Promise<ModelsCacheEntry | null> {
  try {
    const raw = await readFile(getCacheFilePath(), "utf8");
    const entry = JSON.parse(raw) as unknown;
    if (isValidEntry(entry) && isFresh(entry)) return entry;
  } catch {
    // Missing or invalid cache files are normal on first boot.
  }
  return null;
}

export async function writeModelsCache(models: LLMModel[]): Promise<void> {
  const cacheFile = getCacheFilePath();
  const entry: ModelsCacheEntry = {
    key: MODELS_WRITE_KEY,
    models,
    refreshedAt: Date.now(),
  };
  await mkdir(path.dirname(cacheFile), { recursive: true });
  await writeFile(cacheFile, JSON.stringify(entry), "utf8");
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
