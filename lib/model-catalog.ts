import type { LLMModel, ModelCreator } from "@/lib/api";
import { shouldIndexModelPage, textMetricValue } from "@/lib/model-metrics";
import { collapseReasoningVariants } from "@/lib/model-reasoning";

export const MODEL_CATALOG_PAGE_SIZE = 48;

export interface CatalogModelSummary {
  id: string;
  name: string;
  slug: string;
  model_creator: ModelCreator;
  provider_icon_url: string | null;
  intelligence_score: number | null;
  output_speed: number | null;
  blended_price: number | null;
  reasoning_model: boolean;
  is_open_weights: boolean;
}

export interface ModelCatalogPageData {
  models: CatalogModelSummary[];
  page: number;
  totalModels: number;
  totalPages: number;
}

export function getIndexableCatalogModels(models: LLMModel[]): LLMModel[] {
  return collapseReasoningVariants(models)
    .filter(shouldIndexModelPage)
    .sort(
      (a, b) =>
        a.model_creator.name.localeCompare(b.model_creator.name) ||
        a.name.localeCompare(b.name),
    );
}

export function getModelCatalogPage(
  models: LLMModel[],
  page: number,
): ModelCatalogPageData | null {
  if (!Number.isSafeInteger(page) || page < 1) return null;

  const indexableModels = getIndexableCatalogModels(models);
  const totalPages = Math.max(
    1,
    Math.ceil(indexableModels.length / MODEL_CATALOG_PAGE_SIZE),
  );
  if (page > totalPages) return null;

  const start = (page - 1) * MODEL_CATALOG_PAGE_SIZE;
  return {
    models: indexableModels
      .slice(start, start + MODEL_CATALOG_PAGE_SIZE)
      .map((model) => ({
        id: model.id,
        name: model.name,
        slug: model.slug,
        model_creator: model.model_creator,
        provider_icon_url: model.provider_icon_url ?? null,
        intelligence_score: textMetricValue(
          model,
          "artificial_analysis_intelligence_index",
        ),
        output_speed: model.median_output_tokens_per_second,
        blended_price: model.pricing.price_1m_blended_3_to_1,
        reasoning_model: model.reasoning_model === true,
        is_open_weights: model.is_open_weights === true,
      })),
    page,
    totalModels: indexableModels.length,
    totalPages,
  };
}
