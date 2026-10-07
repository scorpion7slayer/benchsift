import "@tanstack/react-start/server-only";
import type { LLMModel } from "./api";
import { fetchWithRetry } from "./fetch-with-retry";
import { createEmptyEvaluations } from "./model-metrics";
import { mergeIdentityMetadata, mergeRevealedStealthModels } from "./model-identity";
import { discoverStealthPageIds, parseStealthPage, safeOpenRouterModelId } from "./stealth-page";
import { logEvent } from "./logger";
import { ANNOUNCED_STEALTH_MODELS } from "./openrouter-model-filter";

async function readPage(path: string): Promise<string> {
  const response = await fetchWithRetry(`https://openrouter.ai/${path}`, {}, { timeoutMs: 6000, maxAttempts: 2 });
  if (!response.ok) throw new Error("OpenRouter page unavailable");
  return response.text();
}

/** Runs during refresh only. Archived previews are absent from the live API. */
export async function enrichStealthModels(models: LLMModel[]): Promise<LLMModel[]> {
  const ids = new Set(models.flatMap((model) => [
    ...(model.stealth_history ?? []).map((row) => row.id),
    ...(model.id.startsWith("openrouter:stealth/") ? [model.id.slice(11)] : []),
  ]).filter((id) => safeOpenRouterModelId(id)));
  Object.keys(ANNOUNCED_STEALTH_MODELS).forEach((id) => ids.add(id));
  for (const namespace of ["stealth", "openrouter"]) {
    try { discoverStealthPageIds(await readPage(namespace)).forEach((id) => ids.add(id)); }
    catch { logEvent("warn", "stealth.discovery_unavailable", { source: namespace }); }
  }
  const result = [...models];
  let found = 0;
  let failed = 0;
  const candidates = [...ids];
  for (let offset = 0; offset < candidates.length; offset += 4) {
    const rows = await Promise.all(candidates.slice(offset, offset + 4).map(async (id) => {
      try { return parseStealthPage(await readPage(id), id); }
      catch { failed++; return null; }
    }));
    for (const row of rows) {
      if (!row) continue;
      found++;
      // Preserve first observation even after a preview was merged into its reveal.
      const previous = result.flatMap((model) => model.stealth_history ?? []).find((old) => old.id === row.id);
      row.firstSeenAt = previous?.firstSeenAt ?? new Date().toISOString();
      row.revealedAs ??= previous?.revealedAs;
      const index = result.findIndex((model) => model.id === `openrouter:${row.id}`);
      const slugBase = row.id.split("/")[1];
      const slug = index >= 0 ? result[index].slug : result.some((model) => model.slug === slugBase)
        ? row.id.replace("/", "-") : slugBase;
      const preview: LLMModel = {
        id: `openrouter:${row.id}`, slug, name: row.name,
        openrouter_api_id: row.id, is_stealth: true, stealth_history: [row],
        release_date: row.listedAt,
        model_creator: { id: "stealth", slug: "stealth", name: "Stealth" },
        evaluations: createEmptyEvaluations(),
        pricing: { price_1m_blended_3_to_1: null, price_1m_input_tokens: null, price_1m_output_tokens: null },
        median_output_tokens_per_second: null,
        median_time_to_first_token_seconds: null,
        median_time_to_first_answer_token: null,
      };
      if (index >= 0) result[index] = mergeIdentityMetadata({ ...result[index], is_stealth: true, stealth_history: [row] }, result[index]);
      else result.push(preview);
    }
  }
  logEvent(failed ? "warn" : "info", "stealth.completed", { checked: candidates.length, found, failed });
  return mergeRevealedStealthModels(result);
}
