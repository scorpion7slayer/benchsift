import type { LLMModel } from "./model-types";
import { describeReasoningVariant } from "./model-reasoning";

/*
 * Artificial Analysis Cyber Index — shared types and catalogue views.
 * Client-safe: the refresh job stores one result per measured model, and the
 * benchmark page, model pages and comparisons read it back from the catalogue.
 */

/** Key of the headline index (0–100) in `LLMModel.evaluations`. */
export const CYBER_INDEX_KEY = "cyber_index";

/**
 * AA `mitigationStatus`. "standard" models keep their usual safety
 * mitigations; "trusted" ones (AA: "unmitigated") are reserved for
 * trusted-access programmes and are not publicly available.
 */
export type CyberAccess = "standard" | "trusted";

export interface CyberBenchmarkResult {
  /** AA evaluation slug, e.g. "cwe-bench-aa". */
  id: string;
  /** AA display name, e.g. "CWE-Bench-AA". */
  label: string;
  /** Headline score, 0–1. */
  score: number | null;
  /** The model or provider declined some of these tasks on safety grounds. */
  safety_blocks: boolean | null;
  cost_per_task_usd: number | null;
}

export interface CyberIndexResult {
  /** Index version named by AA, e.g. "v1". */
  version: string | null;
  /** Share of index tasks solved, 0–100. */
  score: number;
  /** Share of index tasks declined on safety grounds, 0–1. */
  safety_block_rate: number | null;
  access: CyberAccess | null;
  /** Average cost of one index task, in USD. */
  cost_per_task_usd: number | null;
  benchmarks: CyberBenchmarkResult[];
}

export function cyberIndexResult(
  model: Pick<LLMModel, "cyber_index_result">,
): CyberIndexResult | null {
  const result = model.cyber_index_result;
  return result && Number.isFinite(result.score) ? result : null;
}

export function isTrustedAccessModel(model: Pick<LLMModel, "cyber_index_result">): boolean {
  return cyberIndexResult(model)?.access === "trusted";
}

/**
 * Successes, safety blocks and the remaining failures as shares (0–1) of the
 * index tasks. Failures stay unknown when the safety-block rate is.
 */
export function cyberOutcomeShares(result: Pick<CyberIndexResult, "score" | "safety_block_rate">) {
  const successes = Math.min(Math.max(result.score / 100, 0), 1);
  const safetyBlocks = result.safety_block_rate == null
    ? null
    : Math.min(Math.max(result.safety_block_rate, 0), 1 - successes);
  return {
    successes,
    safetyBlocks,
    failures: safetyBlocks == null ? null : Math.max(1 - successes - safetyBlocks, 0),
  };
}

export interface CyberLeaderboardRow {
  slug: string;
  name: string;
  creatorSlug: string;
  creatorName: string;
  iconUrl: string | null;
  /** Position by index score; tied models share the best rank. */
  rank: number;
  result: CyberIndexResult;
}

export interface CyberLeaderboard {
  version: string | null;
  benchmarks: Array<{ id: string; label: string }>;
  rows: CyberLeaderboardRow[];
}

/** Every measured configuration, best index first, with its benchmarks in source order. */
export function cyberLeaderboard(models: LLMModel[]): CyberLeaderboard {
  const measured = models
    .flatMap((model) => {
      const result = cyberIndexResult(model);
      return result ? [{ model, result }] : [];
    })
    .sort((a, b) => b.result.score - a.result.score || a.model.name.localeCompare(b.model.name));
  const benchmarks = new Map<string, string>();
  for (const { result } of measured) {
    for (const benchmark of result.benchmarks) {
      if (!benchmarks.has(benchmark.id)) benchmarks.set(benchmark.id, benchmark.label);
    }
  }
  let rank = 0;
  return {
    version: measured[0]?.result.version ?? null,
    benchmarks: [...benchmarks].map(([id, label]) => ({ id, label })),
    rows: measured.map(({ model, result }, index) => {
      if (index === 0 || result.score !== measured[index - 1].result.score) rank = index + 1;
      return {
        slug: model.slug,
        name: model.name,
        creatorSlug: model.model_creator.slug,
        creatorName: model.model_creator.name,
        iconUrl: model.provider_icon_url ?? null,
        rank,
        result,
      };
    }),
  };
}

export interface CyberCounterpart {
  slug: string;
  name: string;
  access: CyberAccess;
  score: number | null;
}

/** Family key of the model a trusted-access configuration is derived from. */
function publicFamilyKey(model: LLMModel): string | null {
  const { familyName } = describeReasoningVariant(model);
  const base = familyName.replace(/\s*\([^()]*\)\s*$/, "").trim();
  if (!base || base === familyName) return null;
  return describeReasoningVariant({ ...model, name: base }).familyKey;
}

/**
 * The other access tier of the same model. AA names a trusted-access
 * configuration after its programme, such as "GPT-6 Sol (Daybreak Blue, max)",
 * so it shares the creator and base name of the public "GPT-6 Sol". Only a
 * result AA marks as trusted access establishes the link.
 */
export function cyberCounterparts(models: LLMModel[], model: LLMModel): CyberCounterpart[] {
  const counterpart = (candidate: LLMModel, access: CyberAccess): CyberCounterpart => ({
    slug: candidate.slug,
    name: candidate.name,
    access,
    score: cyberIndexResult(candidate)?.score ?? null,
  });
  if (isTrustedAccessModel(model)) {
    const key = publicFamilyKey(model);
    if (!key) return [];
    const publicModels = models
      .filter((candidate) => !isTrustedAccessModel(candidate) && describeReasoningVariant(candidate).familyKey === key)
      // The measured configuration first, then the family's shortest slug.
      .sort((a, b) =>
        Number(cyberIndexResult(b) !== null) - Number(cyberIndexResult(a) !== null) ||
        a.slug.length - b.slug.length ||
        a.slug.localeCompare(b.slug));
    return publicModels.slice(0, 1).map((candidate) => counterpart(candidate, "standard"));
  }
  const familyKey = describeReasoningVariant(model).familyKey;
  return models
    .filter((candidate) => isTrustedAccessModel(candidate) && publicFamilyKey(candidate) === familyKey)
    .map((candidate) => counterpart(candidate, "trusted"));
}

/* ------------------------------------------------------- leaderboard page */

export type CyberSortDirection = "asc" | "desc";

/**
 * Page state kept in the URL. `sort` and `chart` name "blocks", "cost" or a
 * benchmark id; the index is the default and is omitted, as are defaults.
 */
export interface CyberSearch {
  q?: string;
  access?: "public";
  sort?: string;
  dir?: CyberSortDirection;
  chart?: string;
}

const SORT_ID = /^[a-z0-9][a-z0-9-]{0,63}$/;
const MAX_QUERY_LENGTH = 80;

/** Scores sort best first; safety blocks and cost sort lowest first. */
export function cyberDefaultDirection(sort: string): CyberSortDirection {
  return sort === "blocks" || sort === "cost" ? "asc" : "desc";
}

function sortId(value: unknown): string | undefined {
  return typeof value === "string" && value !== "index" && SORT_ID.test(value) ? value : undefined;
}

export function parseCyberSearch(raw: Record<string, unknown>): CyberSearch {
  const q = typeof raw.q === "string" ? raw.q.trim().slice(0, MAX_QUERY_LENGTH) : "";
  const sort = sortId(raw.sort);
  const dir = raw.dir === "asc" || raw.dir === "desc" ? raw.dir : undefined;
  const chart = sortId(raw.chart);
  const search: CyberSearch = {
    q: q || undefined,
    access: raw.access === "public" ? "public" : undefined,
    sort,
    dir: dir && dir !== cyberDefaultDirection(sort ?? "index") ? dir : undefined,
    chart: chart === "blocks" || chart === "cost" ? undefined : chart,
  };
  return Object.fromEntries(Object.entries(search).filter(([, value]) => value !== undefined)) as CyberSearch;
}

export function cyberSortValue(row: CyberLeaderboardRow, sort: string): number | null {
  if (sort === "index") return row.result.score;
  if (sort === "blocks") return row.result.safety_block_rate;
  if (sort === "cost") return row.result.cost_per_task_usd;
  return row.result.benchmarks.find((benchmark) => benchmark.id === sort)?.score ?? null;
}

/**
 * Rows to show. Missing values sort last in both directions and ties keep the
 * index order; filtering never changes a row's rank.
 */
export function selectCyberRows(
  rows: CyberLeaderboardRow[],
  {
    matches,
    publicOnly,
    sort,
    direction,
  }: { matches: (row: CyberLeaderboardRow) => boolean; publicOnly: boolean; sort: string; direction: CyberSortDirection },
): CyberLeaderboardRow[] {
  const sign = direction === "asc" ? 1 : -1;
  return rows
    .filter((row) => (!publicOnly || row.result.access !== "trusted") && matches(row))
    .map((row, index) => ({ row, index, value: cyberSortValue(row, sort) }))
    .sort((a, b) => {
      if (a.value === null || b.value === null) {
        if (a.value !== b.value) return a.value === null ? 1 : -1;
      } else if (a.value !== b.value) {
        return sign * (a.value - b.value);
      }
      return a.index - b.index;
    })
    .map(({ row }) => row);
}
