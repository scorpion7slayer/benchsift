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
    (env as unknown as { ARTIFICIAL_ANALYSIS_FALLBACK_API_KEY_4?: string }).ARTIFICIAL_ANALYSIS_FALLBACK_API_KEY_4,
  ].filter((k): k is string => typeof k === "string" && k.length > 0);

  let lastStatus = 0;
  let lastErrorName = "";
  for (let i = 0; i < keys.length; i++) {
    try {
      const res = await fetch(AA_MODELS_URL, {
        headers: { "x-api-key": keys[i] },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) {
        lastStatus = res.status;
        continue;
      }
      const json = (await res.json()) as AAApiResponse<unknown[]>;
      return json.data ?? [];
    } catch (e) {
      lastErrorName = e instanceof Error ? e.name : "Error";
    }
  }
  // Never include key material (even partial) in the error message —
  // it would otherwise flow into console.error and leak via worker logs.
  throw new Error(
    `All ${keys.length} AA keys failed (lastStatus=${lastStatus} lastError=${lastErrorName || "none"})`,
  );
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
