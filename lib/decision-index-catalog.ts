import type { LLMModel } from "./model-types";
import { resolveModelSlug } from "./model-identity";
import type { DecisionIndexRow } from "./decision-index-data";

/** Catalogue identity of a Decision Index row, for its logo, creator and link. */
export interface DecisionIndexModelInfo {
  slug: string;
  creatorSlug: string;
  creatorName: string;
  iconUrl: string | null;
}

/** AA writes "jev-1.13" as "jev-1-13" in its ids; the catalogue keeps the dot. */
function looseKey(slug: string): string {
  return slug.toLowerCase().replace(/\./g, "-");
}

/**
 * Joins Decision Index rows to the catalogue by the model part of the AA id:
 * slug or alias first, then the same slug with dots read as dashes, against
 * the catalogue slug or the OpenRouter model id. A loose key shared by several
 * catalogue models stays unmatched rather than guessing.
 */
export function matchDecisionIndexModels(
  models: LLMModel[],
  rows: ReadonlyArray<Pick<DecisionIndexRow, "id" | "model_slug">>,
): Record<string, DecisionIndexModelInfo> {
  const bySlug = new Map(models.map((model) => [model.slug, model]));
  const loose = new Map<string, Set<string>>();
  for (const model of models) {
    const routerSlug = model.openrouter_api_id?.split("/").slice(1).join("/");
    for (const key of [model.slug, routerSlug]) {
      if (!key) continue;
      const slugs = loose.get(looseKey(key)) ?? new Set<string>();
      slugs.add(model.slug);
      loose.set(looseKey(key), slugs);
    }
  }
  const matches: Record<string, DecisionIndexModelInfo> = {};
  for (const row of rows) {
    if (row.id in matches) continue;
    let model = bySlug.get(resolveModelSlug(models, row.model_slug));
    if (!model) {
      const candidates = loose.get(looseKey(row.model_slug));
      model = candidates?.size === 1 ? bySlug.get([...candidates][0]) : undefined;
    }
    if (!model) continue;
    matches[row.id] = {
      slug: model.slug,
      creatorSlug: model.model_creator.slug,
      creatorName: model.model_creator.name,
      iconUrl: model.provider_icon_url ?? null,
    };
  }
  return matches;
}

/** A model's Decision Index result, with its rank among all measured configurations. */
export interface ModelDecisionIndex {
  row: DecisionIndexRow;
  rank: number;
  total: number;
}

/**
 * The Decision Index row of one catalogue model. Rows arrive best first, so a
 * model AA measured through several hosts keeps its best result.
 */
export function decisionIndexForModel(
  rows: readonly DecisionIndexRow[],
  matches: Readonly<Record<string, DecisionIndexModelInfo>>,
  slug: string,
): ModelDecisionIndex | null {
  const index = rows.findIndex((row) => matches[row.id]?.slug === slug);
  return index === -1 ? null : { row: rows[index], rank: index + 1, total: rows.length };
}
