import type { LLMModel } from "./api";
import type { Lang, Translations } from "./i18n";
import {
  AA_MEDIA_BENCHMARK_DEFS,
  TEXT_BENCHMARK_KEYS,
  applicableExtraBenchmarkEntries,
  textMetricValue,
  numericEval,
} from "./model-metrics";
import {
  MISSING,
  formatMoney,
  formatNumber,
  formatPercent,
  formatSeconds,
  formatSpeed,
  formatTokens,
} from "./format";

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
  | "points"
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
  /** Short definition shown next to the row label. */
  hint?: string;
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

function numericValues(row: ComparisonRow): number[] {
  return row.values.filter(
    (value): value is number => typeof value === "number" && Number.isFinite(value),
  );
}

/**
 * Position of a value relative to the best one in its row, in (0, 1]. Drives
 * the small bars; rows without a direction or a second value have none.
 */
export function comparisonShare(row: ComparisonRow, value: ComparisonValue): number | null {
  if (!row.direction || typeof value !== "number" || !Number.isFinite(value) || value < 0) return null;
  const values = numericValues(row);
  if (values.length < 2 || values.some((item) => item < 0)) return null;
  if (row.direction === "higher") {
    const max = Math.max(...values);
    return max > 0 ? value / max : null;
  }
  const min = Math.min(...values);
  return value > 0 ? min / value : null;
}

/** How many times the lowest compared price this price is, when it is not the lowest. */
export function comparisonPriceRatio(row: ComparisonRow, value: ComparisonValue): number | null {
  if (row.format !== "money" || typeof value !== "number" || !Number.isFinite(value)) return null;
  const values = numericValues(row);
  if (values.length < 2) return null;
  const min = Math.min(...values);
  if (min <= 0) return null;
  const ratio = value / min;
  return ratio >= 1.05 ? ratio : null;
}

export function formatComparisonValue(
  value: ComparisonValue,
  row: Pick<ComparisonRow, "format">,
  lang: Lang,
  labels: { yes: string; no: string },
): string {
  if (value === null) return MISSING;
  if (typeof value === "boolean") return value ? labels.yes : labels.no;
  if (typeof value === "string") return value || MISSING;
  switch (row.format) {
    case "percent":
      return formatPercent(value, lang);
    case "points":
      return formatPercent(value / 100, lang);
    case "money":
      return formatMoney(value, lang);
    case "seconds":
      return formatSeconds(value, lang);
    case "speed":
      return formatSpeed(value, lang);
    case "tokens":
      return formatTokens(value, lang);
    case "elo":
      return `${formatNumber(value, lang, 0)} Elo`;
    case "rank":
      return `#${value}`;
    default:
      return formatNumber(value, lang, Number.isInteger(value) || Math.abs(value) >= 1000 ? 0 : 1);
  }
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
    // AA publishes these as 0–1 fractions, like the benchmarks above.
    "humaneval",
    "omniscience",
    "omniscience_non_hallucination",
    "multilingual_aa",
    "mmmu_pro",
    "critpt",
    "apex_agents",
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
    // Design Arena win rates are published in percentage points; other
    // unknown fields keep their raw units, without guessed direction.
    add(
      key,
      benchmarkLabels(key, t),
      "benchmarks",
      (m) => extra.get(m.slug)?.get(key),
      key.startsWith("openrouter_da_")
        ? { format: "points", direction: "higher" }
        : { format: "number" },
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
  add("verbosity", f.verbosity, "info", (m) => m.intelligence_index_tokens, {
    format: "tokens",
  });
  add(
    "evaluation-cost",
    f.evalCost,
    "info",
    (m) => m.intelligence_index_cost_usd,
    { format: "money" },
  );
  add(
    "cost-per-task",
    f.costPerTask,
    "pricing",
    (m) => m.intelligence_index_cost_per_task_usd,
    { format: "money", direction: "lower", essential: true },
  );
  add(
    "openrouter_weekly_rank",
    f.openrouterWeeklyRank,
    "info",
    (m) => m.openrouter_weekly_rank,
    { format: "rank" },
  );
  const g = t.glossary;
  const hints: Record<string, string> = {
    artificial_analysis_intelligence_index: g.intelligence,
    artificial_analysis_coding_index: g.coding,
    artificial_analysis_math_index: g.math,
    agentic_index: g.agentic,
    speed: g.outputSpeed,
    ttft: g.ttft,
    "first-answer": g.firstAnswer,
    "end-to-end": g.endToEnd,
    price_1m_blended_3_to_1: t.detail.blendedTooltip,
    price_1m_blended_7_2_1: t.detail.blended721Tooltip,
    context: g.contextWindow,
    "open-weights": g.openWeights,
    openrouter_weekly_rank: g.openrouterRank,
  };
  return rows.map((row) => (hints[row.id] ? { ...row, hint: hints[row.id] } : row));
}
