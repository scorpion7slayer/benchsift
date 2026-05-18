// Standalone refresh logic for the KV models cache.
// Intentionally has NO framework dependency — it only needs the raw
// `CloudflareEnv` bindings, so it can be called from:
//   - `src/server.ts > scheduled()` (cron, runs on its own CPU budget)
//   - `src/routes/api/cron/refresh.ts` (manual trigger via HTTP, capped by
//     `limits.cpu_ms`)

import { enrichModelsWithOpenRouter } from "@/lib/openrouter";
import type { LLMModel } from "@/lib/api";

const AA_MODELS_URL = "https://artificialanalysis.ai/api/v2/data/llms/models";
export const KV_KEY = "nxtaicard:models:v3";
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
    env.ARTIFICIAL_ANALYSIS_FALLBACK_API_KEY_4,
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
  const kv = env.MODELS_KV;
  if (!kv) throw new Error("MODELS_KV binding missing");
  const aaModels = (await fetchModelsFromAA(env)) as LLMModel[];
  const models = await enrichModelsWithOpenRouter(aaModels, {
    apiKey: env.OPENROUTER_API_KEY,
    includeUsageRankings: true,
  });
  const entry = { models, refreshedAt: Date.now() };
  await kv.put(KV_KEY, JSON.stringify(entry), {
    expirationTtl: KV_TTL_SECONDS,
  });
  return { count: models.length, durationMs: Date.now() - started };
}
