function normaliseOpenRouterId(id: string): string {
  return id.trim().toLowerCase().replace(/^openrouter:/, "");
}

/**
 * OpenRouter also exposes routers and request-building services through its
 * models endpoint. They are usable API products, but they are not standalone
 * AI models and therefore do not belong in the BenchSift model catalogue.
 * OpenRouter owns the `openrouter/*` namespace, so matching the namespace also
 * covers newly introduced services such as `openrouter/auto-beta`.
 */
export function isOpenRouterNonModelId(id: string): boolean {
  return normaliseOpenRouterId(id).startsWith("openrouter/");
}

/**
 * Free OpenRouter variants are provider endpoints rather than separate model
 * releases. Keeping them as catalogue rows duplicates some models and makes a
 * zero-dollar endpoint win the model-price ranking.
 */
export function isOpenRouterFreeVariantId(id: string): boolean {
  return normaliseOpenRouterId(id).endsWith(":free");
}

export function isExcludedOpenRouterModelId(id: string): boolean {
  return isOpenRouterNonModelId(id) || isOpenRouterFreeVariantId(id);
}

export interface OpenRouterCatalogIdentity {
  id: string;
  architecture?: {
    tokenizer?: string | null;
  } | null;
}

export function isExcludedOpenRouterCatalogEntry(
  model: OpenRouterCatalogIdentity,
): boolean {
  return (
    isExcludedOpenRouterModelId(model.id) ||
    model.architecture?.tokenizer?.trim().toLowerCase() === "router"
  );
}

export function filterOpenRouterCatalogEntries<
  T extends OpenRouterCatalogIdentity,
>(models: readonly T[]): T[] {
  return models.filter((model) => !isExcludedOpenRouterCatalogEntry(model));
}
