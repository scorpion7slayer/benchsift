import type { LLMModel } from "@/lib/api";
import { shouldIndexModelPage } from "@/lib/model-metrics";
import { collapseReasoningVariants } from "@/lib/model-reasoning";

export const MODEL_CATALOG_PAGE_SIZE = 48;

export interface ModelCatalogPageData {
  models: LLMModel[];
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
    models: indexableModels.slice(start, start + MODEL_CATALOG_PAGE_SIZE),
    page,
    totalModels: indexableModels.length,
    totalPages,
  };
}
