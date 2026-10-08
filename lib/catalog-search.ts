import type { AvailabilityFilter } from "@/lib/model-availability";
import {
  DEFAULT_SORT_DIRECTION,
  type CategoryFilter,
  type NormalRankingKey,
  type SortDirection,
  type SortKey,
  type WeightAccessFilter,
} from "@/lib/model-grid-logic";

/**
 * Catalogue state kept in the URL so a filtered view can be shared or
 * revisited. Defaults are omitted to keep links short; unknown values are
 * dropped rather than trusted.
 */
export interface CatalogSearch {
  q?: string;
  view?: "advanced";
  rank?: Exclude<NormalRankingKey, "intelligence">;
  sort?: Exclude<SortKey, "intelligence">;
  /** Written only when it differs from the sort's default direction. */
  dir?: SortDirection;
  provider?: string;
  weights?: Exclude<WeightAccessFilter, "all">;
  /** Advanced only: hide or keep only models AA marks as not publicly available. */
  availability?: Exclude<AvailabilityFilter, "all">;
  type?: Exclude<CategoryFilter, "all">;
  /** Advanced thresholds: minimum Intelligence Index, maximum blended price… */
  min?: number;
  price?: number;
  ctx?: number;
  speed?: number;
  reasoning?: "yes" | "no";
}

/** Threshold presets: the only values a URL may carry. */
export const THRESHOLD_PRESETS = {
  min: [20, 30, 40, 50, 60],
  price: [0.5, 1, 2, 5, 10],
  ctx: [32_000, 128_000, 200_000, 1_000_000],
  speed: [50, 100, 200],
} as const;
type ThresholdKey = keyof typeof THRESHOLD_PRESETS;

function preset(value: unknown, key: ThresholdKey): number | undefined {
  const number = typeof value === "string" || typeof value === "number" ? Number(value) : Number.NaN;
  return (THRESHOLD_PRESETS[key] as readonly number[]).includes(number) ? number : undefined;
}

const RANKS = ["coding", "math", "speed", "price_asc", "cyber"] as const;
const SORTS = [
  "coding", "math", "agentic", "cyber", "gpqa", "mmlu_pro", "hle", "livecodebench", "math_500", "aime_25",
  "speed", "ttft", "openrouter_popular", "price", "input_price", "output_price", "cost_per_task", "context", "newest", "name",
] as const;
/** Links shared before sorts gained a direction. */
const LEGACY_SORTS: Record<string, { sort: (typeof SORTS)[number]; dir: SortDirection }> = {
  price_asc: { sort: "price", dir: "asc" },
  price_desc: { sort: "price", dir: "desc" },
};
const DIRECTIONS = ["asc", "desc"] as const;
const WEIGHTS = ["open", "closed"] as const;
const AVAILABILITY = ["public", "restricted"] as const;
const TYPES = [
  "new", "stealth", "text", "image", "embeddings", "audio", "video", "rerank",
  "speech", "transcription", "decisions",
] as const;
const MAX_QUERY_LENGTH = 80;
const PROVIDER_PATTERN = /^[a-z0-9][a-z0-9._-]{0,63}$/;

function oneOf<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  return typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}

export function parseCatalogSearch(raw: Record<string, unknown>): CatalogSearch {
  const q = typeof raw.q === "string" ? raw.q.trim().slice(0, MAX_QUERY_LENGTH) : "";
  const provider = typeof raw.provider === "string" && PROVIDER_PATTERN.test(raw.provider) ? raw.provider : undefined;
  const legacy = typeof raw.sort === "string" ? LEGACY_SORTS[raw.sort] : undefined;
  const sort = legacy?.sort ?? oneOf(raw.sort, SORTS);
  const dir = oneOf(raw.dir, DIRECTIONS) ?? legacy?.dir;
  const search: CatalogSearch = {
    q: q || undefined,
    view: raw.view === "advanced" ? "advanced" : undefined,
    rank: oneOf(raw.rank, RANKS),
    sort,
    dir: dir && dir !== DEFAULT_SORT_DIRECTION[sort ?? "intelligence"] ? dir : undefined,
    provider,
    weights: oneOf(raw.weights, WEIGHTS),
    availability: oneOf(raw.availability, AVAILABILITY),
    type: oneOf(raw.type, TYPES),
    min: preset(raw.min, "min"),
    price: preset(raw.price, "price"),
    ctx: preset(raw.ctx, "ctx"),
    speed: preset(raw.speed, "speed"),
    reasoning: oneOf(raw.reasoning, ["yes", "no"] as const),
  };
  return Object.fromEntries(Object.entries(search).filter(([, value]) => value !== undefined)) as CatalogSearch;
}

export interface CatalogState {
  query: string;
  viewMode: "normal" | "advanced";
  ranking: NormalRankingKey;
  sort: SortKey;
  direction: SortDirection;
  provider: string;
  weights: WeightAccessFilter;
  availability: AvailabilityFilter;
  category: CategoryFilter;
  minScore: number | null;
  maxPrice: number | null;
  minContext: number | null;
  minSpeed: number | null;
  reasoning: "all" | "yes" | "no";
}

export function catalogStateFromSearch(search: CatalogSearch): CatalogState {
  return {
    query: search.q ?? "",
    viewMode: search.view ?? "normal",
    ranking: search.rank ?? "intelligence",
    sort: search.sort ?? "intelligence",
    direction: search.dir ?? DEFAULT_SORT_DIRECTION[search.sort ?? "intelligence"],
    provider: search.provider ?? "all",
    weights: search.weights ?? "all",
    availability: search.availability ?? "all",
    category: search.type ?? "all",
    minScore: search.min ?? null,
    maxPrice: search.price ?? null,
    minContext: search.ctx ?? null,
    minSpeed: search.speed ?? null,
    reasoning: search.reasoning ?? "all",
  };
}

/** Advanced-only controls are written only in Advanced mode, Normal-only ones in Normal mode. */
export function searchFromCatalogState(state: CatalogState): CatalogSearch {
  const advanced = state.viewMode === "advanced";
  return parseCatalogSearch({
    q: state.query,
    view: advanced ? "advanced" : undefined,
    rank: advanced ? undefined : state.ranking,
    sort: advanced ? state.sort : undefined,
    dir: advanced ? state.direction : undefined,
    provider: state.provider === "all" ? undefined : state.provider,
    weights: state.weights,
    availability: advanced ? state.availability : undefined,
    type: advanced ? state.category : undefined,
    min: advanced ? state.minScore ?? undefined : undefined,
    price: advanced ? state.maxPrice ?? undefined : undefined,
    ctx: advanced ? state.minContext ?? undefined : undefined,
    speed: advanced ? state.minSpeed ?? undefined : undefined,
    reasoning: advanced && state.reasoning !== "all" ? state.reasoning : undefined,
  });
}

export function sameCatalogSearch(a: CatalogSearch, b: CatalogSearch): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]) as Set<keyof CatalogSearch>;
  return [...keys].every((key) => a[key] === b[key]);
}
