const OPENROUTER_NON_MODEL_IDS = new Set([
  "openrouter/auto",
  "openrouter/bodybuilder",
  "openrouter/free",
  "openrouter/fusion",
  "openrouter/pareto-code",
]);

/**
 * OpenRouter also exposes routers and request-building services through its
 * models endpoint. They are usable API products, but they are not standalone
 * AI models and therefore do not belong in the BenchSift model catalogue.
 */
export function isOpenRouterNonModelId(id: string): boolean {
  const normalized = id
    .toLowerCase()
    .replace(/^openrouter:/, "")
    .replace(/:free$/, "");
  return OPENROUTER_NON_MODEL_IDS.has(normalized);
}
