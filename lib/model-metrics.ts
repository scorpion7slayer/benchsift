import type { Evaluations, LLMModel } from "@/lib/api";

export type ModelPrimaryCategory =
  | "text"
  | "image"
  | "audio"
  | "video"
  | "embeddings"
  | "rerank"
  | "transcription"
  | "unknown";

export const AA_INDEX_KEYS = new Set([
  "artificial_analysis_intelligence_index",
  "artificial_analysis_coding_index",
  "artificial_analysis_math_index",
  "intelligence_index",
  "coding_index",
  "math_index",
  "agentic_index",
]);

export const TEXT_BENCHMARK_KEYS = new Set([
  "mmlu_pro",
  "gpqa",
  "hle",
  "livecodebench",
  "scicode",
  "math_500",
  "aime",
  "aime_25",
  "aime25",
  "ifbench",
  "lcr",
  "terminalbench_hard",
  "tau2",
  "humaneval",
  "omniscience",
  "multilingual_aa",
  "mmmu_pro",
  "critpt",
  "gdpval",
  "gdpval_normalized",
  "apex_agents",
  "itbench_aa",
  "omniscience_non_hallucination",
]);

export const AA_MEDIA_BENCHMARK_DEFS = [
  {
    kind: "text_to_image",
    eloKey: "artificial_analysis_media_text_to_image_elo",
    rankKey: "artificial_analysis_media_text_to_image_rank",
    appearancesKey: "artificial_analysis_media_text_to_image_appearances",
    label: { fr: "Texte vers image ELO", en: "Text-to-image ELO" },
  },
  {
    kind: "image_editing",
    eloKey: "artificial_analysis_media_image_editing_elo",
    rankKey: "artificial_analysis_media_image_editing_rank",
    appearancesKey: "artificial_analysis_media_image_editing_appearances",
    label: { fr: "Edition image ELO", en: "Image editing ELO" },
  },
  {
    kind: "text_to_video",
    eloKey: "artificial_analysis_media_text_to_video_elo",
    rankKey: "artificial_analysis_media_text_to_video_rank",
    appearancesKey: "artificial_analysis_media_text_to_video_appearances",
    label: { fr: "Texte vers video ELO", en: "Text-to-video ELO" },
  },
  {
    kind: "image_to_video",
    eloKey: "artificial_analysis_media_image_to_video_elo",
    rankKey: "artificial_analysis_media_image_to_video_rank",
    appearancesKey: "artificial_analysis_media_image_to_video_appearances",
    label: { fr: "Image vers video ELO", en: "Image-to-video ELO" },
  },
  {
    kind: "text_to_speech",
    eloKey: "artificial_analysis_media_text_to_speech_elo",
    rankKey: "artificial_analysis_media_text_to_speech_rank",
    appearancesKey: "artificial_analysis_media_text_to_speech_appearances",
    label: { fr: "Texte vers voix ELO", en: "Text-to-speech ELO" },
  },
] as const;

export function createEmptyEvaluations(): Evaluations {
  return {
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
    tau2: null,
  };
}

export function numericEval(
  evaluations: Evaluations,
  key: string,
): number | null {
  const value = evaluations[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function hasEvaluationValue(
  evaluations: Evaluations,
  keys: Iterable<string>,
): boolean {
  for (const key of keys) {
    if (numericEval(evaluations, key) !== null) return true;
  }
  return false;
}

export function isTextBenchmarkKey(key: string): boolean {
  return AA_INDEX_KEYS.has(key) || TEXT_BENCHMARK_KEYS.has(key);
}

export function outputModalities(model: LLMModel): Set<string> {
  const modalities = new Set<string>();
  for (const modality of model.openrouter_output_modalities ?? []) {
    modalities.add(modality);
  }
  if (model.output_modality_text) modalities.add("text");
  if (model.output_modality_image) modalities.add("image");
  if (model.output_modality_speech) modalities.add("speech");
  if (model.output_modality_video) modalities.add("video");
  return modalities;
}

export function inputModalities(model: LLMModel): Set<string> {
  const modalities = new Set<string>();
  for (const modality of model.openrouter_input_modalities ?? []) {
    modalities.add(modality);
  }
  if (model.input_modality_text) modalities.add("text");
  if (model.input_modality_image) modalities.add("image");
  if (model.input_modality_speech) modalities.add("audio");
  if (model.input_modality_video) modalities.add("video");
  return modalities;
}

export function isTextOutputModel(model: LLMModel): boolean {
  const output = outputModalities(model);
  if (output.size > 0) return output.has("text");
  return hasEvaluationValue(model.evaluations, [
    ...AA_INDEX_KEYS,
    ...TEXT_BENCHMARK_KEYS,
  ]);
}

const OPEN_WEIGHT_LICENSES = new Set([
  "apache-2.0",
  "mit",
  "bsd-2-clause",
  "bsd-3-clause",
  "cc-by-4.0",
  "cc-by-sa-4.0",
  "cc0-1.0",
  "openrail",
  "bigscience-openrail-m",
  "creativeml-openrail-m",
  "gemma",
  "llama2",
  "llama3",
  "llama3.1",
  "llama3.2",
  "llama3.3",
  "qwen-research",
]);

export function isOpenWeightsModel(model: LLMModel): boolean {
  if (model.is_open_weights === true) return true;
  if (model.huggingface_official === true && Boolean(model.huggingface_url)) return true;
  const license = model.huggingface_license?.trim().toLowerCase();
  if (license && OPEN_WEIGHT_LICENSES.has(license)) return true;
  return false;
}

export function getPrimaryCategory(model: LLMModel): ModelPrimaryCategory {
  const output = outputModalities(model);
  if (output.has("text")) return "text";
  if (output.has("image")) return "image";
  if (output.has("video")) return "video";
  if (output.has("audio") || output.has("speech")) return "audio";
  if (output.has("transcription")) return "transcription";
  if (output.has("embeddings")) return "embeddings";
  if (output.has("rerank")) return "rerank";

  const input = inputModalities(model);
  if (input.has("image")) return "image";
  if (input.has("video")) return "video";
  if (input.has("audio") || input.has("speech")) return "audio";

  return isTextOutputModel(model) ? "text" : "unknown";
}

export function textMetricValue(
  model: LLMModel,
  key: keyof Evaluations | string,
): number | null {
  if (!isTextOutputModel(model)) return null;
  return numericEval(model.evaluations, String(key));
}

export function hasAAIndexBenchmarks(model: LLMModel): boolean {
  return isTextOutputModel(model) && hasEvaluationValue(model.evaluations, [
    "artificial_analysis_intelligence_index",
    "artificial_analysis_coding_index",
    "artificial_analysis_math_index",
    "agentic_index",
  ]);
}

export function hasStandardTextBenchmarks(model: LLMModel): boolean {
  return isTextOutputModel(model) && hasEvaluationValue(model.evaluations, TEXT_BENCHMARK_KEYS);
}

export function mediaBenchmarkValues(model: LLMModel) {
  return AA_MEDIA_BENCHMARK_DEFS
    .map((def) => {
      const elo = numericEval(model.evaluations, def.eloKey);
      if (elo === null) return null;
      return {
        ...def,
        elo,
        rank: numericEval(model.evaluations, def.rankKey),
        appearances: numericEval(model.evaluations, def.appearancesKey),
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);
}

export function hasMediaBenchmarks(model: LLMModel): boolean {
  return mediaBenchmarkValues(model).length > 0;
}

export function hasPricingData(model: LLMModel): boolean {
  const pricing = model.pricing;
  return Boolean(
    pricing.price_1m_blended_3_to_1 != null ||
    pricing.price_1m_input_tokens != null ||
    pricing.price_1m_output_tokens != null ||
    pricing.price_1m_cache_write_tokens != null ||
    pricing.price_1m_reasoning_tokens != null ||
    pricing.price_web_search != null ||
    pricing.price_1m_cache_hit_tokens != null ||
    pricing.price_1m_blended_7_2_1 != null ||
    (pricing.openrouter_display_prices?.length ?? 0) > 0,
  );
}

export function hasAnyBenchmarkData(model: LLMModel): boolean {
  return (
    hasAAIndexBenchmarks(model) ||
    hasStandardTextBenchmarks(model) ||
    hasMediaBenchmarks(model) ||
    applicableExtraBenchmarkEntries(model).length > 0
  );
}

export function hasPerformanceData(model: LLMModel): boolean {
  return Boolean(
    model.median_output_tokens_per_second != null ||
    model.median_time_to_first_token_seconds != null ||
    model.median_time_to_first_answer_token != null ||
    model.end_to_end_response_time_seconds != null,
  );
}

export function hasOpenRouterUsageData(model: LLMModel): boolean {
  return Boolean(
    model.openrouter_weekly_rank != null ||
    model.openrouter_weekly_tokens != null ||
    model.openrouter_weekly_requests != null ||
    model.openrouter_weekly_tool_calls != null ||
    model.openrouter_weekly_images != null ||
    model.openrouter_weekly_audio_inputs != null,
  );
}

export function hasHuggingFaceSignal(model: LLMModel): boolean {
  if (model.huggingface_official !== true || !model.huggingface_url) return false;
  return Boolean(
    (model.huggingface_downloads ?? 0) > 0 ||
    (model.huggingface_likes ?? 0) > 0 ||
    model.huggingface_license ||
    model.huggingface_pipeline_tag ||
    model.huggingface_library_name ||
    (model.huggingface_inference_providers?.length ?? 0) > 0,
  );
}

export function shouldIndexModelPage(model: LLMModel): boolean {
  return Boolean(
    hasAnyBenchmarkData(model) ||
    hasPerformanceData(model) ||
    hasOpenRouterUsageData(model) ||
    hasHuggingFaceSignal(model),
  );
}

export function applicableExtraBenchmarkEntries(model: LLMModel) {
  return Object.entries(model.evaluations)
    .filter(([key, value]) => {
      if (value === null || value === undefined) return false;
      if (AA_INDEX_KEYS.has(key) || TEXT_BENCHMARK_KEYS.has(key)) return false;
      if (key.startsWith("artificial_analysis_media_")) return false;
      if (isTextBenchmarkKey(key) && !isTextOutputModel(model)) return false;
      return typeof value === "number" && Number.isFinite(value);
    })
    .sort(([a], [b]) => a.localeCompare(b));
}
