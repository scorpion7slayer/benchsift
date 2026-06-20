export function mergeModelHistory<T extends { slug: string }>(
  freshModels: T[],
  previousModels: T[],
): { models: T[]; retainedCount: number } {
  const freshSlugs = new Set(freshModels.map((model) => model.slug));
  const retainedModels = previousModels.filter(
    (model) => !freshSlugs.has(model.slug),
  );

  return {
    models: [...freshModels, ...retainedModels],
    retainedCount: retainedModels.length,
  };
}
