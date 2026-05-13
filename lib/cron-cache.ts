import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { LLMModel } from "@/lib/api";

// Dedicated KV key kept distinct from OpenNext's `unstable_cache` entries.
// The list is refreshed by the scheduled handler in `custom-worker.ts`.
const MODELS_KEY = "nxtaicard:models:v1";

// Stale-but-readable window: even if the cron is broken, the page keeps
// serving the last known list rather than hitting the slow scrape path.
// Tune up if AA refreshes infrequently; tune down for fresher data.
const STALE_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

interface ModelsCacheEntry {
  models: LLMModel[];
  refreshedAt: number; // ms epoch
}

function getContext() {
  try {
    return getCloudflareContext();
  } catch {
    return null;
  }
}

function getKV(): KVNamespace | null {
  const c = getContext();
  return c?.env.NEXT_INC_CACHE_KV ?? null;
}

export async function readModelsCache(): Promise<ModelsCacheEntry | null> {
  const kv = getKV();
  if (!kv) return null;
  const raw = await kv.get(MODELS_KEY, "json");
  if (!raw || typeof raw !== "object") return null;
  const entry = raw as ModelsCacheEntry;
  if (!Array.isArray(entry.models)) return null;
  return entry;
}

export async function writeModelsCache(models: LLMModel[]): Promise<void> {
  const kv = getKV();
  if (!kv) return;
  const entry: ModelsCacheEntry = { models, refreshedAt: Date.now() };
  await kv.put(MODELS_KEY, JSON.stringify(entry), {
    expirationTtl: STALE_TTL_SECONDS,
  });
}

/**
 * Best-effort background write. Schedules the put via `ctx.waitUntil` so the
 * caller (typically a user-facing request) returns immediately without paying
 * the KV write CPU/latency cost. Silently no-ops if no Cloudflare context.
 */
export function scheduleWriteModelsCache(models: LLMModel[]): void {
  const c = getContext();
  if (!c?.env.NEXT_INC_CACHE_KV) return;
  c.ctx.waitUntil(writeModelsCache(models));
}
