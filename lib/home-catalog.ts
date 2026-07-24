import type { Evaluations, LLMModel, ModelCreator, Pricing } from "@/lib/api";
import { isOpenWeightsModel } from "@/lib/model-metrics";
import { modelReleaseTime } from "@/lib/model-release";
import { collapseReasoningVariants } from "@/lib/model-reasoning";

export interface HomeCatalogModel {
  name: string;
  slug: string;
  model_creator: Pick<ModelCreator, "name" | "slug">;
  evaluations: Pick<
    Evaluations,
    | "artificial_analysis_intelligence_index"
    | "artificial_analysis_coding_index"
    | "artificial_analysis_math_index"
  >;
  pricing: Pick<Pricing, "price_1m_blended_3_to_1">;
  median_output_tokens_per_second: number | null;
  is_open_weights: boolean;
  provider_icon_url?: string | null;
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

  return {
    count: catalogModels.length,
    latestModels: latestModelSummaries(catalogModels),
    models: catalogModels.map((model) => {
      const creatorSlug = model.model_creator.slug;
      let creator = creators.get(creatorSlug);
      if (!creator) {
        creator = {
          name: model.model_creator.name,
          slug: creatorSlug,
        };
        creators.set(creatorSlug, creator);
      }

      return {
        name: model.name,
        slug: model.slug,
        model_creator: creator,
        evaluations: {
          artificial_analysis_intelligence_index:
            model.evaluations.artificial_analysis_intelligence_index,
          artificial_analysis_coding_index:
            model.evaluations.artificial_analysis_coding_index,
          artificial_analysis_math_index:
            model.evaluations.artificial_analysis_math_index,
        },
        pricing: {
          price_1m_blended_3_to_1: model.pricing.price_1m_blended_3_to_1,
        },
        median_output_tokens_per_second: model.median_output_tokens_per_second,
        is_open_weights: isOpenWeightsModel(model),
        provider_icon_url: model.provider_icon_url,
      };
    }),
  };
}
