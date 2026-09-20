import type { LLMModel } from "@/lib/api";
import {
  getCanonicalCreatorSlug,
  getCreatorDisplayName,
} from "@/lib/provider-map";
import { isExcludedOpenRouterModelId } from "@/lib/openrouter-model-filter";

type RecordValue = Record<string, unknown>;
function record(value: unknown): RecordValue {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as RecordValue)
    : {};
}
function finite(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : undefined;
}
function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
function owner(value: string): string {
  return getCanonicalCreatorSlug(value);
}
function key(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Canonical models.json entries only. Provider endpoints never become models. */
export function parseModelsDev(payload: unknown): LLMModel[] {
  return Object.entries(record(payload)).flatMap(([id, raw]) => {
    const row = record(raw);
    if (
      row.id !== id ||
      !/^[a-z0-9][a-z0-9._-]*\/[a-z0-9][a-z0-9._-]*$/i.test(id) ||
      id.length > 105 ||
      isExcludedOpenRouterModelId(id) ||
      /(?:^|[-/])latest$/i.test(id)
    )
      return [];
    const name = text(row.name);
    if (!name) return [];
    const [lab] = id.split("/");
    const creator = owner(lab);
    const limit = record(row.limit);
    const modalities = record(row.modalities);
    const input = Array.isArray(modalities.input) ? modalities.input : null;
    const output = Array.isArray(modalities.output) ? modalities.output : null;
    const model: LLMModel = {
      id: `modelsdev:${id}`,
      slug: `modelsdev-${id.replaceAll("/", "-")}`,
      name,
      model_creator: {
        id: creator,
        slug: creator,
        name: getCreatorDisplayName(creator, lab),
      },
      release_date: /^\d{4}-\d{2}-\d{2}$/.test(String(row.release_date))
        ? String(row.release_date)
        : null,
      evaluations: {
        artificial_analysis_intelligence_index: null,
        artificial_analysis_coding_index: null,
        artificial_analysis_math_index: null,
        mmlu_pro: null,
        gpqa: null,
        hle: null,
        livecodebench: null,
        scicode: null,
        math_500: null,
        aime: null,
        aime_25: null,
        ifbench: null,
        lcr: null,
        terminalbench_hard: null,
        terminalbench_v2_1: null,
        tau2: null,
        tau_banking: null,
      },
      pricing: {
        price_1m_blended_3_to_1: null,
        price_1m_input_tokens: null,
        price_1m_output_tokens: null,
      },
      median_output_tokens_per_second: null,
      median_time_to_first_token_seconds: null,
      median_time_to_first_answer_token: null,
      models_dev_id: id,
      models_dev_url: `https://models.dev/models/${id.split("/").map(encodeURIComponent).join("/")}`,
      context_window_tokens: finite(limit.context),
      knowledge_cutoff: text(row.knowledge),
      ...(typeof row.open_weights === "boolean"
        ? { is_open_weights: row.open_weights }
        : {}),
      ...(typeof row.reasoning === "boolean"
        ? { reasoning_model: row.reasoning }
        : {}),
      ...(input
        ? {
            input_modality_text: input.includes("text"),
            input_modality_image: input.includes("image"),
            input_modality_speech: input.includes("audio"),
            input_modality_video: input.includes("video"),
          }
        : {}),
      ...(output
        ? {
            output_modality_text: output.includes("text"),
            output_modality_image: output.includes("image"),
            output_modality_speech: output.includes("audio"),
            output_modality_video: output.includes("video"),
          }
        : {}),
    };
    return [model];
  });
}

/** Match exact source IDs, or unambiguous creator + punctuation-normalised name.
 * Never borrow benchmark measurements or hosted prices from Models.dev.
 */
export function mergeModelsDev(
  models: LLMModel[],
  additions: LLMModel[],
): LLMModel[] {
  const result = [...models];
  const identities = new Map<string, Set<number>>();
  const identitiesFor = (m: LLMModel): string[] => {
    const prefix = `${owner(m.model_creator.slug)}:`;
    return [
      m.models_dev_id,
      m.openrouter_api_id,
      m.id.replace(/^(openrouter:|modelsdev:)/, ""),
    ]
      .filter((id): id is string => Boolean(id?.includes("/")))
      .map((id) => `id:${id.toLowerCase()}`)
      .concat([
        `${prefix}${key(m.name)}`,
        `${prefix}${key(m.slug.replace(/^modelsdev-[^-]+-/, ""))}`,
      ]);
  };
  const index = (m: LLMModel, i: number) => {
    for (const k of identitiesFor(m)) {
      const set = identities.get(k) ?? new Set<number>();
      set.add(i);
      identities.set(k, set);
    }
  };
  result.forEach(index);
  for (const extra of additions) {
    if (!extra.models_dev_id || isExcludedOpenRouterModelId(extra.models_dev_id) || /(?:^|[-/])latest$/i.test(extra.models_dev_id)) continue;
    const keys = identitiesFor(extra);
    // Canonical tail is useful for AA slugs; ownership always scopes the match.
    keys.push(
      `${owner(extra.model_creator.slug)}:${key(extra.models_dev_id.split("/")[1])}`,
    );
    const exact = identities.get(`id:${extra.models_dev_id.toLowerCase()}`);
    const candidates =
      exact ?? new Set(keys.flatMap((k) => [...(identities.get(k) ?? [])]));
    if (candidates.size > 1) continue; // Ambiguous variant: do not add a duplicate or guess.
    const i = [...candidates][0];
    if (i === undefined) {
      index(extra, result.length);
      result.push(extra);
      continue;
    }
    const current = result[i];
    const merged = {
      ...current,
      models_dev_id: extra.models_dev_id,
      models_dev_url: extra.models_dev_url,
    };
    const fields = [
      "release_date",
      "context_window_tokens",
      "knowledge_cutoff",
      "is_open_weights",
      "reasoning_model",
      "input_modality_text",
      "input_modality_image",
      "input_modality_speech",
      "input_modality_video",
      "output_modality_text",
      "output_modality_image",
      "output_modality_speech",
      "output_modality_video",
    ] as const;
    for (const field of fields)
      if (merged[field] == null && extra[field] != null)
        Object.assign(merged, { [field]: extra[field] });
    result[i] = merged;
    index(merged, i);
  }
  return result;
}
