import type { LLMModel } from "./api";

/** Supplements fill gaps; a slow result never erases measured catalogue values. */
export function enrichComparisonModel(
  model: LLMModel,
  supplement?: Partial<LLMModel>,
): LLMModel {
  if (!supplement) return model;
  const result = { ...model };
  for (const [key, value] of Object.entries(supplement)) {
    if (
      key === "id" ||
      key === "slug" ||
      key === "name" ||
      key === "model_creator"
    )
      continue;
    if (value === null || value === undefined) continue;
    if (key === "evaluations" || key === "pricing") {
      const current = model[key];
      const merged = { ...current } as Record<string, unknown>;
      for (const [field, extra] of Object.entries(value))
        if (merged[field] == null && extra != null) merged[field] = extra;
      (result as unknown as Record<string, unknown>)[key] = merged;
    } else if ((result as unknown as Record<string, unknown>)[key] == null) {
      (result as unknown as Record<string, unknown>)[key] = value;
    }
  }
  return result;
}
