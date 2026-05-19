import { getModelsKV } from "@/lib/cf-env";
import type { LLMModel } from "@/lib/api";
import {
  MODELS_KEYS,
  MODELS_TTL_SECONDS,
  MODELS_WRITE_KEY,
} from "@/lib/models-cache-keys";

interface ModelsCacheEntry {
  models: LLMModel[];
  refreshedAt: number; // ms epoch
}

function isValidEntry(raw: unknown): raw is ModelsCacheEntry {
  if (!raw || typeof raw !== "object") return false;
  const entry = raw as ModelsCacheEntry;
  return Array.isArray(entry.models) && entry.models.length > 0;
}

export async function readModelsCache(): Promise<ModelsCacheEntry | null> {
  const kv = getModelsKV();
  if (!kv) return null;
  for (const key of MODELS_KEYS) {
    const raw = await kv.get(key, "json");
    if (isValidEntry(raw)) return raw;
  }
  return null;
}

export async function writeModelsCache(models: LLMModel[]): Promise<void> {
  const kv = getModelsKV();
  if (!kv) return;
  const entry: ModelsCacheEntry = { models, refreshedAt: Date.now() };
  await kv.put(MODELS_WRITE_KEY, JSON.stringify(entry), {
    expirationTtl: MODELS_TTL_SECONDS,
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
