import type { LLMModel } from "./model-types";
import { resolveModelSlug } from "./model-identity";

/** Catalogue identity of a FrontierCode row, for its logo, creator and link. */
export interface FrontierCodeModelInfo {
  slug: string;
  creatorSlug: string;
  creatorName: string;
  iconUrl: string | null;
}

/**
 * Joins FrontierCode rows to the catalogue by AA slug, then by alias. Unknown
 * slugs stay unmatched so the page keeps the source name rather than guessing.
 */
export function matchFrontierCodeModels(
  models: LLMModel[],
  rows: ReadonlyArray<{ slug: string }>,
): Record<string, FrontierCodeModelInfo> {
  const bySlug = new Map(models.map((model) => [model.slug, model]));
  const matches: Record<string, FrontierCodeModelInfo> = {};
  for (const row of rows) {
    if (row.slug in matches) continue;
    const model = bySlug.get(resolveModelSlug(models, row.slug));
    if (!model) continue;
    matches[row.slug] = {
      slug: model.slug,
      creatorSlug: model.model_creator.slug,
      creatorName: model.model_creator.name,
      iconUrl: model.provider_icon_url ?? null,
    };
  }
  return matches;
}
