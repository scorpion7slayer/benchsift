import type { LLMModel } from "./model-types";
import { resolveModelSlug } from "./model-identity";
import { describeReasoningVariant, getModelReasoningFamily } from "./model-reasoning";

/** Catalogue identity of a DeepSWE configuration, for its name, logo and link. */
export interface DeepSweModelInfo {
  /** Catalogue page of the matching reasoning level, or of the model itself. */
  slug: string;
  /** Family name without the reasoning level, e.g. "GPT-5.6 Sol". */
  name: string;
  creatorSlug: string;
  creatorName: string;
  iconUrl: string | null;
}

export function deepSweCatalogKey(model: string, effort: string | null): string {
  return `${model}|${effort ?? ""}`;
}

/**
 * Joins DeepSWE model slugs to the catalogue. DeepSWE names models by slug and
 * reasoning effort; when the catalogue lists that effort as its own
 * configuration, the link opens it. Unknown slugs stay unmatched so the page
 * falls back to the source identifier rather than guessing a model.
 */
export function matchDeepSweModels(
  models: LLMModel[],
  rows: ReadonlyArray<{ model: string; reasoning_effort: string | null }>,
): Record<string, DeepSweModelInfo> {
  const bySlug = new Map(models.map((model) => [model.slug, model]));
  const matches: Record<string, DeepSweModelInfo> = {};
  for (const row of rows) {
    const key = deepSweCatalogKey(row.model, row.reasoning_effort);
    if (key in matches) continue;
    const base = bySlug.get(resolveModelSlug(models, row.model));
    if (!base) continue;
    const family = getModelReasoningFamily(models, base.slug);
    const effort = row.reasoning_effort?.toLowerCase() ?? null;
    const variant = effort
      ? family?.variants.find(({ descriptor }) => descriptor.effort === effort)?.model
      : undefined;
    const model = variant ?? base;
    matches[key] = {
      slug: model.slug,
      // A lone configuration still drops its reasoning qualifier: DeepSWE shows the effort itself.
      name: family && family.variants.length > 1 ? family.familyName : describeReasoningVariant(base).familyName,
      creatorSlug: model.model_creator.slug,
      creatorName: model.model_creator.name,
      iconUrl: model.provider_icon_url ?? null,
    };
  }
  return matches;
}
