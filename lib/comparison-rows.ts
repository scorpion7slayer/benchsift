import type { LLMModel } from "./api";
import type { Lang, Translations } from "./i18n";
import {
  AA_MEDIA_BENCHMARK_DEFS,
  TEXT_BENCHMARK_KEYS,
  applicableExtraBenchmarkEntries,
  textMetricValue,
  numericEval,
} from "./model-metrics";

export type ComparisonValue = number | string | boolean | null;
export type ComparisonGroup =
  | "benchmarks"
  | "performance"
  | "pricing"
  | "capabilities"
  | "info";
export type ComparisonFormat =
  | "number"
  | "percent"
  | "money"
  | "tokens"
  | "seconds"
  | "speed"
  | "elo"
  | "rank";
export interface ComparisonRow {
  id: string;
  label: string;
  group: ComparisonGroup;
  values: ComparisonValue[];
  direction?: "higher" | "lower";
  format?: ComparisonFormat;
  essential?: boolean;
}

export function bestComparisonValue(row: ComparisonRow): number | null {
  if (!row.direction) return null;
  const values = row.values.filter(
    (value): value is number =>
      typeof value === "number" && Number.isFinite(value),
  );
  // A single reported value or identical scores cannot establish an advantage.
  if (values.length < 2 || new Set(values).size < 2) return null;
  return row.direction === "higher" ? Math.max(...values) : Math.min(...values);
}
export function comparisonHasDifferences(row: ComparisonRow): boolean {
  return new Set(row.values).size > 1;
}
const benchmarkLabels = (key: string, t: Translations): string => {
  const labels = t.benchmarks as unknown as Record<string, string>;
  const aliases: Record<string, string> = {
    artificial_analysis_intelligence_index: "intelligence",
    artificial_analysis_coding_index: "coding",
    artificial_analysis_math_index: "math",
    agentic_index: "agentic",
  };
  return (
    labels[aliases[key] ?? key] ??
    key.replace(/^openrouter_da_/, "OpenRouter ").replaceAll("_", " ")
  );
};

export function buildComparisonRows(
  models: LLMModel[],
  t: Translations,
  lang: Lang,
): ComparisonRow[] {
  const rows: ComparisonRow[] = [];
  const add = (
    id: string,
    label: string,
    group: ComparisonGroup,
    get: (m: LLMModel) => ComparisonValue | undefined,
    options: Partial<ComparisonRow> = {},
  ) => {
    const values = models.map((model) => {
      const value = get(model);
      return value === undefined ||
        (typeof value === "number" && !Number.isFinite(value))
        ? null
        : value;
    });
    if (values.some((value) => value !== null))
      rows.push({ id, label, group, values, ...options });
  };
  const indices = [
    "artificial_analysis_intelligence_index",
    "artificial_analysis_coding_index",
    "artificial_analysis_math_index",
    "agentic_index",
  ];
  const percentages = [
    "mmlu_pro",
    "gpqa",
    "hle",
    "livecodebench",
    "scicode",
    "math_500",
    "aime",
    "aime_25",
    "ifbench",
    "lcr",
    "terminalbench_hard",
    "terminalbench_v2_1",
    "tau2",
    "tau_banking",
    "gdpval_normalized",
    "itbench_aa",
  ];
  for (const key of [...indices, ...percentages])
    add(
      key,
      benchmarkLabels(key, t),
      "benchmarks",
      (m) => textMetricValue(m, key),
      {
        direction: "higher",
        format: indices.includes(key) ? "number" : "percent",
        essential: indices.includes(key),
      },
    );
  for (const key of TEXT_BENCHMARK_KEYS) {
    if (percentages.includes(key)) continue;
    add(
      key,
      benchmarkLabels(key, t),
      "benchmarks",
      (m) => textMetricValue(m, key),
      { format: "number" },
    );
  }
  for (const def of AA_MEDIA_BENCHMARK_DEFS)
    add(
      def.eloKey,
      def.label[lang],
      "benchmarks",
      (m) => numericEval(m.evaluations, def.eloKey),
      { direction: "higher", format: "elo", essential: true },
    );
  const extra = new Map(
    models.map((model) => [
      model.slug,
      new Map(applicableExtraBenchmarkEntries(model)),
    ]),
  );
  const keys = [
    ...new Set([...extra.values()].flatMap((entries) => [...entries.keys()])),
  ].sort();
  for (const key of keys) {
    if (rows.some((row) => row.id === key)) continue;
    // Unknown source fields keep their raw numeric units, without guessed percentages or direction.
    add(
      key,
      benchmarkLabels(key, t),
      "benchmarks",
      (m) => extra.get(m.slug)?.get(key),
      { format: "number" },
    );
  }
  const f = t.compare.fields;
  add(
    "speed",
    f.outputSpeed,
    "performance",
    (m) => m.median_output_tokens_per_second,
    { direction: "higher", format: "speed", essential: true },
  );
  add(
    "ttft",
    f.ttft,
    "performance",
    (m) => m.median_time_to_first_token_seconds,
    { direction: "lower", format: "seconds", essential: true },
  );
  add(
    "first-answer",
    f.firstAnswer,
    "performance",
    (m) => m.median_time_to_first_answer_token,
    { direction: "lower", format: "seconds" },
  );
  add(
    "end-to-end",
    f.endToEnd,
    "performance",
    (m) => m.end_to_end_response_time_seconds,
    { direction: "lower", format: "seconds" },
  );
  const priceFields = [
    ["price_1m_input_tokens", f.inputPrice],
    ["price_1m_output_tokens", f.outputPrice],
    ["price_1m_cache_hit_tokens", f.cacheHitPrice],
    ["price_1m_blended_3_to_1", f.blendedPrice],
    ["price_1m_blended_7_2_1", f.blended721Price],
  ] as const;
  for (const [key, label] of priceFields)
    add(key, `${label} · $ / 1M tokens`, "pricing", (m) => m.pricing[key], {
      direction: "lower",
      format: "money",
      essential:
        key === "price_1m_input_tokens" || key === "price_1m_output_tokens",
    });
  const prices = new Map(
    models.flatMap((m) =>
      (m.pricing.openrouter_display_prices ?? []).map(
        (price) => [JSON.stringify([price.label, price.unit]), price] as const,
      ),
    ),
  );
  for (const [key, price] of prices)
    add(
      `price:${key}`,
      `${price.label} · ${price.unit}`,
      "pricing",
      (m) =>
        m.pricing.openrouter_display_prices?.find(
          (p) => JSON.stringify([p.label, p.unit]) === key,
        )?.price,
      { direction: "lower", format: "money" },
    );
  add(
    "context",
    t.detail.contextWindow,
    "capabilities",
    (m) => m.context_window_tokens,
    { direction: "higher", format: "tokens", essential: true },
  );
  add(
    "reasoning",
    t.detail.reasoning,
    "capabilities",
    (m) => m.reasoning_model,
    { essential: true },
  );
  add(
    "open-weights",
    t.detail.openWeights,
    "capabilities",
    (m) => m.is_open_weights,
    { essential: true },
  );
  add(
    "parameters",
    `${t.detail.totalParams} (B)`,
    "capabilities",
    (m) => m.total_parameters_b,
  );
  add(
    "active-parameters",
    `${t.detail.activeParams} (B)`,
    "capabilities",
    (m) => m.active_parameters_b,
  );
  add(
    "max-output",
    t.detail.maxOutputTokens,
    "capabilities",
    (m) => m.openrouter_max_completion_tokens,
    { format: "tokens" },
  );
  add(
    "parameters-supported",
    t.detail.supportedParameters,
    "capabilities",
    (m) => m.openrouter_supported_parameters?.join(", "),
  );
  for (const modality of ["text", "image", "video", "speech"] as const) {
    const name = t.detail.modalityLabels[modality];
    add(
      `input-${modality}`,
      `${t.detail.inputModality} · ${name}`,
      "capabilities",
      (m) => m[`input_modality_${modality}`],
    );
    add(
      `output-${modality}`,
      `${t.detail.outputModality} · ${name}`,
      "capabilities",
      (m) => m[`output_modality_${modality}`],
    );
  }
  add("provider", f.provider, "info", (m) => m.model_creator.name);
  add("release", f.releaseDate, "info", (m) => m.release_date);
  add("knowledge", f.knowledgeCutoff, "info", (m) => m.knowledge_cutoff);
  add("openness", f.opennessIndex, "info", (m) => m.openness_index);
  add("verbosity", f.verbosity, "info", (m) => m.intelligence_index_tokens);
  add(
    "evaluation-cost",
    f.evalCost,
    "info",
    (m) => m.intelligence_index_cost_usd,
    { format: "money" },
  );
  const usage = [
    ["openrouter_weekly_rank", f.openrouterWeeklyRank],
    ["openrouter_weekly_tokens", f.openrouterWeeklyTokens],
    ["openrouter_weekly_requests", f.openrouterWeeklyRequests],
    ["openrouter_weekly_tool_calls", f.openrouterWeeklyToolCalls],
    ["openrouter_weekly_images", f.openrouterWeeklyImages],
    ["openrouter_weekly_audio_inputs", f.openrouterWeeklyAudioInputs],
  ] as const;
  for (const [key, label] of usage)
    add(key, label, "info", (m) => m[key], {
      format: key === "openrouter_weekly_rank" ? "rank" : "tokens",
    });
  return rows;
}
