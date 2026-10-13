import { findFlightElementProps, parseFlightRecords } from "./aa-flight";
import { getCanonicalCreatorSlug, getCreatorDisplayName } from "./provider-map";

/*
 * Artificial Analysis FrontierCode leaderboard, read from the `initialModels`
 * prop of the `/evaluations/frontiercode` RSC payload. AA publishes the score
 * per model as a fraction, plus the token counts, prices, cache hit rate and
 * output speed its page turns into cost, time and tokens per task. The same
 * formulas are applied here; tests pin them to the values AA displays.
 */

/** Size of FrontierCode 1.1 Main, the task set AA runs; per-task figures divide by it. */
export const FRONTIERCODE_TASKS = 100;

export interface FrontierCodeRow {
  /** AA model slug, also the catalogue join key. */
  slug: string;
  /** Full AA name, including the configuration. */
  name: string;
  /** Name without the configuration, e.g. "Claude Opus 5.5". */
  family_name: string;
  /** AA configuration suffix, e.g. "Max, Default Fallback". */
  configuration: string | null;
  score: number;
  release_date: string | null;
  creator_slug: string | null;
  creator_name: string | null;
  is_reasoning: boolean | null;
  is_open_weights: boolean | null;
  /** Answer plus reasoning tokens per task. */
  output_tokens_per_task: number | null;
  cost_per_task_usd: number | null;
  /** Decode time per task: output tokens over output speed, without TTFT or overhead. */
  time_per_task_seconds: number | null;
}

export interface FrontierCodeData {
  rows: FrontierCodeRow[];
}

export type FrontierCodeSort = "score" | "release";

const SLUG_PATTERN = /^[a-z0-9][a-z0-9._-]{0,119}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}(?:$|T)/;

type Props = Record<string, unknown>;

function isProps(value: unknown): value is Props {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function flag(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function count(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

type PerTask = Pick<FrontierCodeRow, "output_tokens_per_task" | "cost_per_task_usd" | "time_per_task_seconds">;

/**
 * Per-task figures as AA computes them. Output tokens need both published
 * halves. Cost needs prices and a cache hit rate: cache hits are billed at the
 * cache-hit price, every other input token at the cache-write price (the input
 * price when there is none), output at the output price. AA shows no cost for
 * a model without a hit rate or priced at zero, so neither does this.
 */
function perTask(model: Props): PerTask {
  const counts = isProps(model.canonicalEvalTokenCounts) ? model.canonicalEvalTokenCounts.frontierCode : null;
  const tokens = isProps(counts) ? counts : {};
  const answer = count(tokens.answer);
  const reasoning = count(tokens.reasoning);
  const output = answer === null || reasoning === null ? null : answer + reasoning;
  if (output === null) return { output_tokens_per_task: null, cost_per_task_usd: null, time_per_task_seconds: null };

  const speed = count(model.medianCanonicalAnswerOutputSpeed);
  const input = count(tokens.input);
  const cacheable = tokens.cacheableInput == null ? 0 : count(tokens.cacheableInput);
  const inputPrice = count(model.price1mInputTokens);
  const outputPrice = count(model.price1mOutputTokens);
  const hitPrice = count(model.cacheHitPrice);
  const writePrice = model.cacheWritePrice == null ? inputPrice : count(model.cacheWritePrice);
  const hitRate = count(model.cacheHitRate);
  const hits = cacheable !== null && hitRate !== null && hitRate <= 1 ? cacheable * hitRate : null;
  const priced = inputPrice !== null && outputPrice !== null && inputPrice + outputPrice > 0;
  const cost =
    priced && input !== null && hits !== null && hits <= input && writePrice !== null && (hits === 0 || hitPrice !== null)
      ? ((input - hits) * writePrice + hits * (hitPrice ?? 0) + output * outputPrice) / 1e6
      : null;
  return {
    output_tokens_per_task: output / FRONTIERCODE_TASKS,
    cost_per_task_usd: cost === null ? null : cost / FRONTIERCODE_TASKS,
    time_per_task_seconds: speed ? output / FRONTIERCODE_TASKS / speed : null,
  };
}

function familyName(name: string, suffix: string | null, release: string | null): string {
  if (release) return release;
  const tail = suffix ? ` (${suffix})` : null;
  return tail && name.endsWith(tail) ? name.slice(0, -tail.length).trim() || name : name;
}

/**
 * Parses the leaderboard. A row needs a valid slug, a name and a score in
 * [0, 1]; a measured zero is kept. Duplicates keep their first occurrence and
 * rows are ordered by score, ties in source order.
 */
export function parseFrontierCode(payload: string): FrontierCodeRow[] {
  const records = parseFlightRecords(payload);
  const [props] = findFlightElementProps(records, (props) => Array.isArray(props.initialModels));
  if (!props) return [];
  const seen = new Set<string>();
  const rows = (props.initialModels as unknown[]).flatMap((model): FrontierCodeRow[] => {
    if (!isProps(model)) return [];
    const slug = text(model.slug);
    const name = text(model.name);
    const score = model.frontierCode;
    if (!slug || !SLUG_PATTERN.test(slug) || !name || seen.has(slug)) return [];
    if (typeof score !== "number" || !Number.isFinite(score) || score < 0 || score > 1) return [];
    seen.add(slug);
    const suffix = text(model.suffix);
    const creator = isProps(model.creator) ? model.creator : null;
    const releaseDate = text(model.releaseDate);
    const creatorSlug = text(creator?.slug);
    const creatorName = text(creator?.name);
    return [{
      slug,
      name,
      family_name: familyName(name, suffix, isProps(model.release) ? text(model.release.name) : null),
      configuration: suffix,
      score,
      release_date: releaseDate && DATE_PATTERN.test(releaseDate) ? releaseDate : null,
      creator_slug: creatorSlug ? getCanonicalCreatorSlug(creatorSlug) : null,
      creator_name: creatorSlug && creatorName ? getCreatorDisplayName(creatorSlug, creatorName) : creatorName,
      is_reasoning: flag(model.isReasoning),
      is_open_weights: flag(model.isOpenWeights),
      ...perTask(model),
    }];
  });
  return rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => b.row.score - a.row.score || a.index - b.index)
    .map(({ row }) => row);
}

function releaseTime(row: FrontierCodeRow): number {
  const time = row.release_date ? Date.parse(row.release_date) : Number.NaN;
  return Number.isNaN(time) ? Number.NEGATIVE_INFINITY : time;
}

/**
 * Filters and orders rows for display. `searchText` adds text to match, such
 * as a catalogue name; a missing release date sorts last.
 */
export function selectFrontierCodeRows(
  rows: readonly FrontierCodeRow[],
  options: { query: string; openOnly: boolean; sort: FrontierCodeSort; searchText?: (row: FrontierCodeRow) => string },
): FrontierCodeRow[] {
  const query = options.query.trim().toLowerCase();
  const selected = rows.filter((row) => {
    if (options.openOnly && row.is_open_weights !== true) return false;
    if (!query) return true;
    return [row.name, row.slug, row.creator_name, row.creator_slug, options.searchText?.(row)]
      .some((value) => value?.toLowerCase().includes(query));
  });
  if (options.sort === "release") {
    return selected
      .map((row, index) => ({ row, index }))
      .sort((a, b) => releaseTime(b.row) - releaseTime(a.row) || a.index - b.index)
      .map(({ row }) => row);
  }
  return selected;
}
