import type { LLMModel } from "@/lib/api";
import type { HomeCatalogModel } from "@/lib/home-catalog";
import { outputModalities, textMetricValue } from "@/lib/model-metrics";

export type SortKey =
  | "intelligence"
  | "coding"
  | "math"
  | "agentic"
  | "cyber"
  | "gpqa"
  | "mmlu_pro"
  | "hle"
  | "livecodebench"
  | "math_500"
  | "aime_25"
  | "speed"
  | "ttft"
  | "openrouter_popular"
  | "price"
  | "input_price"
  | "output_price"
  | "cost_per_task"
  | "context"
  | "newest"
  | "name";

export type SortDirection = "asc" | "desc";

export type NormalRankingKey =
  | "intelligence"
  | "coding"
  | "math"
  | "speed"
  | "price_asc"
  | "cyber";

export type WeightAccessFilter = "all" | "open" | "closed";

export type CategoryFilter =
  | "all"
  | "new"
  | "stealth"
  | "text"
  | "image"
  | "embeddings"
  | "audio"
  | "video"
  | "rerank"
  | "speech"
  | "transcription"
  | "decisions";

type ModelComparator<T> = (left: T, right: T) => number;

function descendingMetric<T>(
  getValue: (item: T) => number | null | undefined,
): ModelComparator<T> {
  return (left, right) => (getValue(right) ?? -1) - (getValue(left) ?? -1);
}

function ascendingMetric<T>(
  getValue: (item: T) => number | null | undefined,
): ModelComparator<T> {
  return (left, right) =>
    (getValue(left) ?? Number.POSITIVE_INFINITY) -
    (getValue(right) ?? Number.POSITIVE_INFINITY);
}

function sortablePrice(model: LLMModel): number | null {
  if (model.pricing.price_1m_blended_3_to_1 !== null) {
    return model.pricing.price_1m_blended_3_to_1;
  }
  const prices = (model.pricing.openrouter_display_prices ?? [])
    .map((row) => row.price)
    .filter((price): price is number => Number.isFinite(price));
  return prices.length > 0 ? Math.min(...prices) : null;
}

function releaseTime(model: LLMModel): number | null {
  if (!model.release_date) return null;
  const time = Date.parse(model.release_date);
  return Number.isFinite(time) ? time : null;
}

const ADVANCED_EVALUATION_SORT_KEYS = {
  intelligence: "artificial_analysis_intelligence_index",
  coding: "artificial_analysis_coding_index",
  math: "artificial_analysis_math_index",
  agentic: "agentic_index",
  cyber: "cyber_index",
  gpqa: "gpqa",
  mmlu_pro: "mmlu_pro",
  hle: "hle",
  livecodebench: "livecodebench",
  math_500: "math_500",
  aime_25: "aime_25",
} as const satisfies Partial<Record<SortKey, string>>;

type NumericSortKey = Exclude<SortKey, "name">;

const ADVANCED_SORT_VALUES: Record<NumericSortKey, (model: LLMModel) => number | null | undefined> = {
  ...(Object.fromEntries(
    Object.entries(ADVANCED_EVALUATION_SORT_KEYS).map(([key, evaluation]) => [
      key,
      (model: LLMModel) => textMetricValue(model, evaluation),
    ]),
  ) as Record<keyof typeof ADVANCED_EVALUATION_SORT_KEYS, (model: LLMModel) => number | null>),
  speed: (model) => model.median_output_tokens_per_second,
  ttft: (model) => model.median_time_to_first_token_seconds,
  openrouter_popular: (model) => model.openrouter_weekly_rank,
  price: sortablePrice,
  input_price: (model) => model.pricing.price_1m_input_tokens,
  output_price: (model) => model.pricing.price_1m_output_tokens,
  cost_per_task: (model) => model.intelligence_index_cost_per_task_usd,
  context: (model) => model.context_window_tokens,
  newest: releaseTime,
};

/**
 * Direction applied when a sort is first chosen: the best value first, so
 * scores, speed, context and dates descend while latency, price, popularity
 * rank and names ascend.
 */
export const DEFAULT_SORT_DIRECTION: Record<SortKey, SortDirection> = {
  intelligence: "desc",
  coding: "desc",
  math: "desc",
  agentic: "desc",
  cyber: "desc",
  gpqa: "desc",
  mmlu_pro: "desc",
  hle: "desc",
  livecodebench: "desc",
  math_500: "desc",
  aime_25: "desc",
  speed: "desc",
  ttft: "asc",
  openrouter_popular: "asc",
  price: "asc",
  input_price: "asc",
  output_price: "asc",
  cost_per_task: "asc",
  context: "desc",
  newest: "desc",
  name: "asc",
};

/** The sort value of a model, or null when the model has no such measurement. */
export function advancedSortValue(model: LLMModel, key: SortKey): number | null {
  if (key === "name") return null;
  const value = ADVANCED_SORT_VALUES[key](model);
  return value != null && Number.isFinite(value) ? value : null;
}

const byIntelligence = descendingMetric<LLMModel>((model) =>
  textMetricValue(model, "artificial_analysis_intelligence_index"),
);

/**
 * Sorts the Advanced catalogue in either direction. Models without the chosen
 * measurement always come last, and ties fall back to the Intelligence Index,
 * then the name, so the order is stable whatever the source order.
 */
export function sortAdvancedModels(
  models: LLMModel[],
  key: SortKey,
  direction: SortDirection = DEFAULT_SORT_DIRECTION[key],
): LLMModel[] {
  const sign = direction === "asc" ? 1 : -1;
  if (key === "name") {
    return [...models].sort((left, right) => sign * left.name.localeCompare(right.name));
  }
  const values = new Map(models.map((model) => [model, advancedSortValue(model, key)]));
  return [...models].sort((left, right) => {
    const a = values.get(left) ?? null;
    const b = values.get(right) ?? null;
    if (a === null || b === null) {
      if (a !== b) return a === null ? 1 : -1;
    } else if (a !== b) {
      return sign * (a - b);
    }
    return byIntelligence(left, right) || left.name.localeCompare(right.name);
  });
}

function homeMetric(
  model: HomeCatalogModel,
  key:
    | "artificial_analysis_intelligence_index"
    | "artificial_analysis_coding_index"
    | "artificial_analysis_math_index"
    | "cyber_index",
): number | null {
  return model.evaluations[key] ?? null;
}

const NORMAL_RANKING_VALUES: Record<
  NormalRankingKey,
  (model: HomeCatalogModel) => number | null
> = {
  intelligence: (model) =>
    homeMetric(model, "artificial_analysis_intelligence_index"),
  coding: (model) => homeMetric(model, "artificial_analysis_coding_index"),
  math: (model) => homeMetric(model, "artificial_analysis_math_index"),
  speed: (model) => model.median_output_tokens_per_second ?? null,
  price_asc: (model) => model.pricing.price_1m_blended_3_to_1 ?? null,
  cyber: (model) => homeMetric(model, "cyber_index"),
};

const NORMAL_MODEL_COMPARATORS: Record<
  NormalRankingKey,
  ModelComparator<HomeCatalogModel>
> = {
  intelligence: descendingMetric(NORMAL_RANKING_VALUES.intelligence),
  coding: descendingMetric(NORMAL_RANKING_VALUES.coding),
  math: descendingMetric(NORMAL_RANKING_VALUES.math),
  speed: descendingMetric(NORMAL_RANKING_VALUES.speed),
  price_asc: ascendingMetric(NORMAL_RANKING_VALUES.price_asc),
  cyber: descendingMetric(NORMAL_RANKING_VALUES.cyber),
};

export function sortHomeModels(
  models: HomeCatalogModel[],
  key: NormalRankingKey,
): HomeCatalogModel[] {
  return [...models].sort(NORMAL_MODEL_COMPARATORS[key]);
}

export function hasNormalRankingValue(
  model: HomeCatalogModel,
  key: NormalRankingKey,
): boolean {
  const value = normalRankingValue(model, key);
  return value !== null && Number.isFinite(value);
}

export function normalRankingValue(
  model: HomeCatalogModel,
  key: NormalRankingKey,
): number | null {
  return NORMAL_RANKING_VALUES[key](model);
}

export function matchesSearch(
  model: Pick<HomeCatalogModel, "name" | "slug" | "model_creator" | "search_aliases" | "stealth_history">,
  query: string,
): boolean {
  if (!query) return true;
  const normalize = (value: string) => value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  const tokens = normalize(query).split(/\s+/).filter(Boolean);
  const haystack = [
    model.name.toLowerCase(),
    model.model_creator.name.toLowerCase(),
    model.slug,
    ...(model.search_aliases ?? []),
    ...(model.stealth_history ?? []).flatMap((row) => [row.id, row.name]),
  ].map(normalize).join(" ");
  return tokens.every((token) => haystack.includes(token));
}

export function matchesWeightAccess(
  isOpenWeights: boolean,
  filter: WeightAccessFilter,
): boolean {
  if (filter === "all") return true;
  return filter === "open" ? isOpenWeights : !isOpenWeights;
}

const NEW_MODELS_DAYS = 30;
const CATEGORY_MODALITIES: Partial<
  Record<CategoryFilter, readonly string[]>
> = {
  text: ["text"],
  image: ["image"],
  audio: ["audio", "speech"],
  video: ["video"],
  embeddings: ["embeddings"],
  rerank: ["rerank"],
  speech: ["speech"],
  transcription: ["transcription"],
  decisions: ["decisions"],
};

export function matchesCategory(
  model: LLMModel,
  category: CategoryFilter,
): boolean {
  if (category === "all") return true;
  if (category === "stealth") return Boolean(model.is_stealth || model.stealth_history?.length);
  if (category === "new") {
    if (!model.release_date) return false;
    const age = Date.now() - new Date(model.release_date).getTime();
    return age <= NEW_MODELS_DAYS * 24 * 60 * 60 * 1_000;
  }
  const output = outputModalities(model);
  return CATEGORY_MODALITIES[category]?.some((modality) => output.has(modality)) ?? false;
}

export interface CatalogThresholds {
  minScore: number | null;
  maxPrice: number | null;
  minContext: number | null;
  minSpeed: number | null;
  reasoning: "all" | "yes" | "no";
}

/**
 * Advanced thresholds. A model without the measured value never passes an
 * active threshold: an unknown price is not "under $1".
 */
export function matchesThresholds(model: LLMModel, thresholds: CatalogThresholds): boolean {
  const { minScore, maxPrice, minContext, minSpeed, reasoning } = thresholds;
  if (minScore !== null) {
    const score = textMetricValue(model, "artificial_analysis_intelligence_index");
    if (score === null || score < minScore) return false;
  }
  if (maxPrice !== null) {
    const price = model.pricing.price_1m_blended_3_to_1;
    if (price == null || price > maxPrice) return false;
  }
  if (minContext !== null && (model.context_window_tokens == null || model.context_window_tokens < minContext)) return false;
  if (minSpeed !== null && (model.median_output_tokens_per_second == null || model.median_output_tokens_per_second < minSpeed)) return false;
  if (reasoning === "yes" && !model.reasoning_model) return false;
  if (reasoning === "no" && model.reasoning_model) return false;
  return true;
}
