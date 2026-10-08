import type { Evaluations, LLMModel, ModelCreator, Pricing } from "@/lib/api";
import { modelAccessRestriction, type ModelAccessRestriction } from "@/lib/model-availability";
import { isOpenWeightsModel, textMetricValue } from "@/lib/model-metrics";
import { modelReleaseTime } from "@/lib/model-release";
import { collapseReasoningVariants } from "@/lib/model-reasoning";

/**
 * One row of the home ranking. The whole catalogue is serialised into the
 * page, so absent values are omitted rather than sent as null, and flags are
 * present only when true.
 */
export interface HomeCatalogModel {
  name: string;
  slug: string;
  model_creator: Pick<ModelCreator, "name" | "slug">;
  evaluations: Partial<Pick<
    Evaluations,
    | "artificial_analysis_intelligence_index"
    | "artificial_analysis_coding_index"
    | "artificial_analysis_math_index"
    | "agentic_index"
    | "cyber_index"
  >>;
  pricing: Partial<Pick<Pricing, "price_1m_blended_3_to_1">>;
  median_output_tokens_per_second?: number;
  context_window_tokens?: number;
  release_date?: string;
  is_open_weights?: true;
  reasoning_model?: true;
  is_stealth?: true;
  /** Present when Artificial Analysis marks the model as not publicly available. */
  access_restriction?: ModelAccessRestriction;
  search_aliases?: LLMModel["search_aliases"];
  stealth_history?: LLMModel["stealth_history"];
  provider_icon_url?: string;
}

export interface LatestModelSummary {
  slug: string;
  name: string;
  providerName: string;
  providerSlug: string;
  providerIconUrl?: string | null;
  releaseDate: string | null;
  releaseTimestamp?: string | null;
}

export interface HomeCatalogData {
  count: number;
  models: HomeCatalogModel[];
  /**
   * Cyber Index ranking rows. AA measures one configuration per model, not
   * always the one a collapsed family shows, so these rows stay uncollapsed.
   */
  cyberModels: HomeCatalogModel[];
  latestModels: LatestModelSummary[];
}

function latestModelSummaries(models: LLMModel[], limit = 3): LatestModelSummary[] {
  return models
    .map((model, index) => ({ model, index, time: modelReleaseTime(model) }))
    .filter((entry) => Number.isFinite(entry.time))
    .sort((a, b) => b.time - a.time || a.index - b.index)
    .slice(0, limit)
    .map(({ model }) => ({
      slug: model.slug,
      name: model.name,
      providerName: model.model_creator.name,
      providerSlug: model.model_creator.slug,
      providerIconUrl: model.provider_icon_url,
      releaseDate: model.release_date,
      releaseTimestamp: model.release_timestamp ?? null,
    }));
}

export function buildHomeCatalogData(models: LLMModel[]): HomeCatalogData {
  const catalogModels = collapseReasoningVariants(models);
  const creators = new Map<string, Pick<ModelCreator, "name" | "slug">>();
  const compact = (model: LLMModel) => {
    const creatorSlug = model.model_creator.slug;
    let creator = creators.get(creatorSlug);
    if (!creator) {
      creator = {
        name: model.model_creator.name,
        slug: creatorSlug,
      };
      creators.set(creatorSlug, creator);
    }

    return compactModel(model, creator);
  };

  return {
    count: catalogModels.length,
    latestModels: latestModelSummaries(catalogModels),
    models: catalogModels.map(compact),
    cyberModels: models.filter((model) => textMetricValue(model, "cyber_index") !== null).map(compact),
  };
}

function present<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined && (typeof value !== "number" || Number.isFinite(value));
}

/** Copies only the values a row can show; a missing one stays absent, never zero. */
function compactModel(model: LLMModel, creator: Pick<ModelCreator, "name" | "slug">): HomeCatalogModel {
  const row: HomeCatalogModel = {
    name: model.name,
    slug: model.slug,
    model_creator: creator,
    evaluations: {},
    pricing: {},
  };
  for (const key of [
    "artificial_analysis_intelligence_index",
    "artificial_analysis_coding_index",
    "artificial_analysis_math_index",
    "agentic_index",
    "cyber_index",
  ] as const) {
    const value = model.evaluations[key];
    if (present(value)) row.evaluations[key] = value;
  }
  if (present(model.pricing.price_1m_blended_3_to_1)) row.pricing.price_1m_blended_3_to_1 = model.pricing.price_1m_blended_3_to_1;
  if (present(model.median_output_tokens_per_second)) row.median_output_tokens_per_second = model.median_output_tokens_per_second;
  if (present(model.context_window_tokens)) row.context_window_tokens = model.context_window_tokens;
  if (model.release_date) row.release_date = model.release_date;
  if (isOpenWeightsModel(model)) row.is_open_weights = true;
  if (model.reasoning_model) row.reasoning_model = true;
  if (model.is_stealth) row.is_stealth = true;
  const restriction = modelAccessRestriction(model);
  if (restriction) row.access_restriction = restriction;
  if (model.search_aliases?.length) row.search_aliases = model.search_aliases;
  if (model.stealth_history?.length) row.stealth_history = model.stealth_history;
  if (model.provider_icon_url) row.provider_icon_url = model.provider_icon_url;
  return row;
}
