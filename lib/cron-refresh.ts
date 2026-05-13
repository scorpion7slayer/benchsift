// Standalone refresh logic for the KV models cache.
// Intentionally has NO dependency on Next.js / OpenNext — it only needs the
// raw `CloudflareEnv` bindings, so it can be called from:
//   - `custom-worker.ts > scheduled()` (cron, 15-min CPU budget on Paid)
//   - `app/api/cron/refresh/route.ts`  (manual trigger via HTTP, capped by
//     `limits.cpu_ms`)

const AA_MODELS_URL = "https://artificialanalysis.ai/api/v2/data/llms/models";
export const KV_KEY = "nxtaicard:models:v1";
const KV_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

interface AAApiResponse<T> {
  status: number;
  data: T;
}

async function fetchModelsFromAA(env: CloudflareEnv): Promise<unknown[]> {
  const keys = [
    env.ARTIFICIAL_ANALYSIS_API_KEY,
    env.ARTIFICIAL_ANALYSIS_FALLBACK_API_KEY,
    env.ARTIFICIAL_ANALYSIS_FALLBACK_API_KEY_2,
    env.ARTIFICIAL_ANALYSIS_FALLBACK_API_KEY_3,
  ].filter((k): k is string => typeof k === "string" && k.length > 0);

  let lastError: unknown = null;
  for (const key of keys) {
    try {
      const res = await fetch(AA_MODELS_URL, {
        headers: { "x-api-key": key },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) {
        lastError = new Error(`AA API ${res.status} on key …${key.slice(-6)}`);
        continue;
      }
      const json = (await res.json()) as AAApiResponse<unknown[]>;
      return json.data ?? [];
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError ?? new Error("All AA keys failed");
}

export interface RefreshResult {
  count: number;
  durationMs: number;
}

export async function refreshKVCache(env: CloudflareEnv): Promise<RefreshResult> {
  const started = Date.now();
  const kv = env.NEXT_INC_CACHE_KV;
  if (!kv) throw new Error("NEXT_INC_CACHE_KV binding missing");
  const models = await fetchModelsFromAA(env);
  const entry = { models, refreshedAt: Date.now() };
  await kv.put(KV_KEY, JSON.stringify(entry), {
    expirationTtl: KV_TTL_SECONDS,
  });
  return { count: models.length, durationMs: Date.now() - started };
}
