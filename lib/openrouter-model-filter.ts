function normaliseOpenRouterId(id: string): string {
  return id.trim().toLowerCase().replace(/^openrouter:/, "");
}

/**
 * OpenRouter also exposes routers and request-building services through its
 * models endpoint. They are usable API products, but they are not standalone
 * AI models and therefore do not belong in the BenchSift model catalogue.
 * The namespace check is conservative; the catalogue-entry filter makes an
 * exception for entries explicitly described as stealth models.
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
  description?: string;
  architecture?: {
    tokenizer?: string | null;
  } | null;
}

export function isOpenRouterStealthEntry(model: Pick<OpenRouterCatalogIdentity, "id" | "description">): boolean {
  const id = normaliseOpenRouterId(model.id);
  return id.startsWith("stealth/") || (id.startsWith("openrouter/") &&
    (id in ANNOUNCED_STEALTH_MODELS || /\b(?:stealth|cloaked|anonymous) model\b/i.test(model.description ?? "")));
}

// OpenRouter's announcements confirm these previews, although their model
// descriptions omit the anonymity. Never infer stealth status from "alpha".
export const ANNOUNCED_STEALTH_MODELS: Record<string, string> = {
  "openrouter/owl-alpha": "https://www.linkedin.com/posts/openrouter_new-stealth-model-owl-alpha-owl-is-a-high-performance-activity-7455630053058457600-11cW",
  "openrouter/pony-alpha": "https://www.linkedin.com/posts/openrouter_were-launching-a-new-stealth-model-on-activity-7425597602622115840-Htol",
  "openrouter/hunter-alpha": "https://www.linkedin.com/posts/openrouter_two-new-stealth-models-are-live-now-hunter-activity-7437620556792942592-0v9Z",
  "openrouter/healer-alpha": "https://www.linkedin.com/posts/openrouter_two-new-stealth-models-are-live-now-hunter-activity-7437620556792942592-0v9Z",
  "openrouter/elephant-alpha": "https://www.linkedin.com/posts/openrouter_welcoming-a-new-stealth-model-on-openrouter-activity-7449480687155326976-VcMA",
};

export function isExcludedOpenRouterCatalogEntry(
  model: OpenRouterCatalogIdentity,
): boolean {
  return (
    isOpenRouterFreeVariantId(model.id) ||
    (isOpenRouterNonModelId(model.id) && !isOpenRouterStealthEntry(model)) ||
    model.architecture?.tokenizer?.trim().toLowerCase() === "router"
  );
}

export function filterOpenRouterCatalogEntries<
  T extends OpenRouterCatalogIdentity,
>(models: readonly T[]): T[] {
  return models.filter((model) => !isExcludedOpenRouterCatalogEntry(model));
}
