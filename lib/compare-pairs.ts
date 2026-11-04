/*
 * Static comparison pages, /compare/<a>-vs-<b>. The indexed pairs are those
 * between the most used models of the week on OpenRouter that the catalogue
 * can compare (an indexable page, an Intelligence Index, a price); any other
 * pair of models still renders, but stays out of search results.
 */
import type { LLMModel } from "@/lib/api";
import { getIndexableCatalogModels } from "@/lib/model-catalog";

/** Models whose pairs are indexed: 12 models make 66 pages per language. */
export const POPULAR_PAIR_MODELS = 12;

const SEPARATOR = "-vs-";

export function comparePairSlug(a: string, b: string): string {
  return `${a}${SEPARATOR}${b}`;
}

export function comparePairPath(a: string, b: string): string {
  return `/compare/${encodeURIComponent(comparePairSlug(a, b))}`;
}

/**
 * The two model slugs of a pair address. A slug may itself contain "-vs-",
 * so each split is tried against the known slugs; the first that names two
 * different models wins.
 */
export function parseComparePair(pair: string, isKnown: (slug: string) => boolean): [string, string] | null {
  let from = 0;
  for (;;) {
    const at = pair.indexOf(SEPARATOR, from);
    if (at <= 0) return null;
    const a = pair.slice(0, at);
    const b = pair.slice(at + SEPARATOR.length);
    if (a && b && a !== b && isKnown(a) && isKnown(b)) return [a, b];
    from = at + 1;
  }
}

/** The most used comparable models of the week, most used first. */
export function popularPairModels(models: LLMModel[], limit = POPULAR_PAIR_MODELS): LLMModel[] {
  const indexable = getIndexableCatalogModels(models);
  return indexable
    .filter((model) => typeof model.openrouter_weekly_rank === "number" && model.openrouter_weekly_rank > 0)
    .sort((a, b) => a.openrouter_weekly_rank! - b.openrouter_weekly_rank! || a.slug.localeCompare(b.slug))
    .slice(0, limit);
}

export interface ComparePair {
  a: { slug: string; name: string };
  b: { slug: string; name: string };
}

/** Every pair of the popular models, the more used model first. */
export function popularComparePairs(models: LLMModel[], limit = POPULAR_PAIR_MODELS): ComparePair[] {
  const popular = popularPairModels(models, limit);
  const pairs: ComparePair[] = [];
  for (let i = 0; i < popular.length; i += 1) {
    for (let j = i + 1; j < popular.length; j += 1) {
      pairs.push({
        a: { slug: popular[i].slug, name: popular[i].name },
        b: { slug: popular[j].slug, name: popular[j].name },
      });
    }
  }
  return pairs;
}

/** The address order of a popular pair, or null when the pair is not one. */
export function popularPairOrder(pairs: ComparePair[], a: string, b: string): [string, string] | null {
  for (const pair of pairs) {
    if (pair.a.slug === a && pair.b.slug === b) return [a, b];
    if (pair.a.slug === b && pair.b.slug === a) return [b, a];
  }
  return null;
}

/** Other popular pairs that include one of the two models, for internal links. */
export function relatedComparePairs(pairs: ComparePair[], a: string, b: string, limit = 8): ComparePair[] {
  return pairs
    .filter((pair) => !(pair.a.slug === a && pair.b.slug === b) && !(pair.a.slug === b && pair.b.slug === a))
    .filter((pair) => [a, b].includes(pair.a.slug) || [a, b].includes(pair.b.slug))
    .slice(0, limit);
}
