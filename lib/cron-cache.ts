import { getModelsKV } from "@/lib/cf-env";
import type { LLMModel } from "@/lib/api";

// Dedicated KV key for the pre-computed models list.
// The list is refreshed by the scheduled handler in `src/server.ts`.
const MODELS_KEY = "nxtaicard:models:v13";

// Stale-but-readable window: even if the cron is broken, the page keeps
// serving the last known list rather than hitting the slow scrape path.
// Tune up if AA refreshes infrequently; tune down for fresher data.
const STALE_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

interface ModelsCacheEntry {
  models: LLMModel[];
  refreshedAt: number; // ms epoch
}

export async function readModelsCache(): Promise<ModelsCacheEntry | null> {
  const kv = getModelsKV();
  if (!kv) return null;
  const raw = await kv.get(MODELS_KEY, "json");
  if (!raw || typeof raw !== "object") return null;
  const entry = raw as ModelsCacheEntry;
  if (!Array.isArray(entry.models)) return null;
  return entry;
}

export async function writeModelsCache(models: LLMModel[]): Promise<void> {
  const kv = getModelsKV();
  if (!kv) return;
  const entry: ModelsCacheEntry = { models, refreshedAt: Date.now() };
  await kv.put(MODELS_KEY, JSON.stringify(entry), {
    expirationTtl: STALE_TTL_SECONDS,
  });
}

/**
 * Best-effort background write. Fires the KV put without awaiting so the
 * caller (typically a user-facing request) returns immediately. Silently
 * no-ops if no Cloudflare KV binding is available.
 */
export function scheduleWriteModelsCache(models: LLMModel[]): void {
  if (!getModelsKV()) return;
  void writeModelsCache(models).catch(() => {
    // Best-effort — the next cron run repopulates KV anyway.
  });
}
