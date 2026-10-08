import type { LLMModel } from "./model-types";
import { cyberCounterparts, type CyberCounterpart } from "./cyber-index";
import { AA_CAPABILITY_INDEX_KEYS, FRACTION_BENCHMARK_KEYS, textMetricValue } from "./model-metrics";
import {
  collapseReasoningVariants,
  type ModelReasoningFamily,
  type ReasoningEffort,
  type ReasoningMode,
} from "./model-reasoning";

/*
 * Derived views of the catalogue for model pages and comparisons: where a
 * model stands among measured models, how its reasoning levels trade score
 * for cost, and which models sit at a similar level. Everything here is
 * computed from sourced values; a missing value stays null.
 */

export type TradeoffScore = "intelligence" | "coding" | "agentic";
export type TradeoffAxis = "cost_per_task" | "index_cost" | "price" | "speed";

const SCORE_KEYS: Record<TradeoffScore, string> = {
  intelligence: "artificial_analysis_intelligence_index",
  coding: "artificial_analysis_coding_index",
  agentic: "agentic_index",
};

/** One reasoning configuration of a model, as plotted by the trade-off charts. */
export interface FamilyPoint {
  slug: string;
  name: string;
  mode: ReasoningMode;
  effort: ReasoningEffort | null;
  scores: Record<TradeoffScore, number | null>;
  axes: Record<TradeoffAxis, number | null>;
}

/** The reasoning family of a compared model, keyed by the compared slug. */
export interface ComparisonFamily {
  familyKey: string;
  familyName: string;
  points: FamilyPoint[];
}

function finite(value: number | null | undefined): number | null {
  return value != null && Number.isFinite(value) ? value : null;
}

export function tradeoffPoint(
  model: LLMModel,
  descriptor: { mode: ReasoningMode; effort: ReasoningEffort | null },
): FamilyPoint {
  return {
    slug: model.slug,
    name: model.name,
    mode: descriptor.mode,
    effort: descriptor.effort,
    scores: {
      intelligence: textMetricValue(model, SCORE_KEYS.intelligence),
      coding: textMetricValue(model, SCORE_KEYS.coding),
      agentic: textMetricValue(model, SCORE_KEYS.agentic),
    },
    axes: {
      cost_per_task: finite(model.intelligence_index_cost_per_task_usd),
      index_cost: finite(model.intelligence_index_cost_usd),
      price: finite(model.pricing.price_1m_blended_3_to_1),
      speed: finite(model.median_output_tokens_per_second),
    },
  };
}

export function familyPoints(family: ModelReasoningFamily): FamilyPoint[] {
  return family.variants.map(({ model, descriptor }) => tradeoffPoint(model, descriptor));
}

/* ------------------------------------------------------------------ ranks */

type Better = "higher" | "lower";

const RANKED_METRICS: Record<string, { better: Better; value: (model: LLMModel) => number | null }> = {
  artificial_analysis_intelligence_index: { better: "higher", value: (m) => textMetricValue(m, "artificial_analysis_intelligence_index") },
  artificial_analysis_coding_index: { better: "higher", value: (m) => textMetricValue(m, "artificial_analysis_coding_index") },
  artificial_analysis_math_index: { better: "higher", value: (m) => textMetricValue(m, "artificial_analysis_math_index") },
  agentic_index: { better: "higher", value: (m) => textMetricValue(m, "agentic_index") },
  cyber_index: { better: "higher", value: (m) => textMetricValue(m, "cyber_index") },
  ...Object.fromEntries(
    AA_CAPABILITY_INDEX_KEYS.map((key) => [key, { better: "higher" as const, value: (m: LLMModel) => textMetricValue(m, key) }]),
  ),
  ...Object.fromEntries(
    FRACTION_BENCHMARK_KEYS.map((key) => [key, { better: "higher" as const, value: (m: LLMModel) => textMetricValue(m, key) }]),
  ),
  gdpval: { better: "higher", value: (m) => textMetricValue(m, "gdpval") },
  speed: { better: "higher", value: (m) => finite(m.median_output_tokens_per_second) },
  ttft: { better: "lower", value: (m) => finite(m.median_time_to_first_token_seconds) },
  price: { better: "lower", value: (m) => finite(m.pricing.price_1m_blended_3_to_1) },
  context: { better: "higher", value: (m) => finite(m.context_window_tokens) },
  cost_per_task: { better: "lower", value: (m) => finite(m.intelligence_index_cost_per_task_usd) },
};

export type RankedMetric = keyof typeof RANKED_METRICS;

/** Position among the catalogue models measured on the same metric; 1 is the best. */
export interface MetricRank {
  rank: number;
  total: number;
}

/** Measured values per metric, best first; built once per catalogue snapshot. */
const rankTables = new WeakMap<LLMModel[], Map<string, number[]>>();

function rankTable(models: LLMModel[], key: string): number[] {
  let tables = rankTables.get(models);
  if (!tables) {
    tables = new Map();
    rankTables.set(models, tables);
  }
  let values = tables.get(key);
  if (!values) {
    const metric = RANKED_METRICS[key];
    values = models.flatMap((model) => {
      const value = metric.value(model);
      return value == null ? [] : [value];
    });
    values.sort(metric.better === "higher" ? (a, b) => b - a : (a, b) => a - b);
    tables.set(key, values);
  }
  return values;
}

/** Number of values strictly better than `value` in a best-first list. */
function countBetter(values: number[], value: number, better: Better): number {
  let low = 0;
  let high = values.length;
  while (low < high) {
    const mid = (low + high) >> 1;
    const isBetter = better === "higher" ? values[mid] > value : values[mid] < value;
    if (isBetter) low = mid + 1;
    else high = mid;
  }
  return low;
}

/**
 * Ranks of a model on every metric it is measured on. Tied models share the
 * best rank, so two models at the same score are both "#3".
 */
export function metricRanks(models: LLMModel[], model: LLMModel): Partial<Record<RankedMetric, MetricRank>> {
  const ranks: Partial<Record<RankedMetric, MetricRank>> = {};
  for (const [key, metric] of Object.entries(RANKED_METRICS)) {
    const value = metric.value(model);
    if (value == null) continue;
    const values = rankTable(models, key);
    ranks[key] = { rank: countBetter(values, value, metric.better) + 1, total: values.length };
  }
  return ranks;
}

/* --------------------------------------------------------- similar models */

export interface SimilarModel {
  slug: string;
  name: string;
  creatorName: string;
  creatorSlug: string;
  providerIconUrl: string | null;
  intelligence: number;
  price: number | null;
  speed: number | null;
}

const collapsedCatalogues = new WeakMap<LLMModel[], LLMModel[]>();

/**
 * Models closest to this one on the Intelligence Index, one per reasoning
 * family and excluding the model's own family, best score first.
 */
export function similarModels(
  models: LLMModel[],
  model: LLMModel,
  familySlugs: ReadonlySet<string>,
  limit = 4,
): SimilarModel[] {
  const target = textMetricValue(model, SCORE_KEYS.intelligence);
  if (target == null) return [];
  let collapsed = collapsedCatalogues.get(models);
  if (!collapsed) {
    collapsed = collapseReasoningVariants(models);
    collapsedCatalogues.set(models, collapsed);
  }
  return collapsed
    .flatMap((candidate) => {
      if (familySlugs.has(candidate.slug) || candidate.slug === model.slug) return [];
      const intelligence = textMetricValue(candidate, SCORE_KEYS.intelligence);
      return intelligence == null ? [] : [{ candidate, intelligence, distance: Math.abs(intelligence - target) }];
    })
    .sort((a, b) => a.distance - b.distance || b.intelligence - a.intelligence || a.candidate.name.localeCompare(b.candidate.name))
    // The same model listed twice by one creator (a batch or fallback listing)
    // shares its score; keep the first, the shorter name sorting earlier.
    .filter((entry, index, list) =>
      list.findIndex((other) =>
        other.candidate.model_creator.slug === entry.candidate.model_creator.slug && other.intelligence === entry.intelligence,
      ) === index)
    .slice(0, limit)
    .sort((a, b) => b.intelligence - a.intelligence)
    .map(({ candidate, intelligence }) => ({
      slug: candidate.slug,
      name: candidate.name,
      creatorName: candidate.model_creator.name,
      creatorSlug: candidate.model_creator.slug,
      providerIconUrl: candidate.provider_icon_url ?? null,
      intelligence,
      price: finite(candidate.pricing.price_1m_blended_3_to_1),
      speed: finite(candidate.median_output_tokens_per_second),
    }));
}

/** What a model page adds to the model itself. */
export interface ModelInsights {
  familyPoints: FamilyPoint[];
  ranks: Partial<Record<RankedMetric, MetricRank>>;
  similar: SimilarModel[];
  /** The trusted-access and public versions of the same model, when AA measured one. */
  cyberCounterparts: CyberCounterpart[];
}

export function modelInsights(models: LLMModel[], family: ModelReasoningFamily, model: LLMModel): ModelInsights {
  return {
    familyPoints: familyPoints(family),
    ranks: metricRanks(models, model),
    similar: similarModels(models, model, new Set(family.variants.map(({ model: variant }) => variant.slug))),
    cyberCounterparts: cyberCounterparts(models, model),
  };
}
