/*
 * The short, data-generated summary at the top of the home page and of each
 * benchmark page: the leader, the best score for the money, the fastest and
 * the date of the data. Pure, so pages compute it on the server and in the
 * browser alike; only sourced values are used, and a missing one leaves its
 * sentence out instead of guessing.
 */

export interface SummaryEntry {
  name: string;
  /** Internal page of the model, when the catalogue has one. */
  href?: string | null;
  score: number | null;
  /** Cost of the measurement unit (task, scene, 1M tokens). */
  cost?: number | null;
  /** Lower is faster: seconds or minutes per task. */
  time?: number | null;
  /** Higher is faster: output tokens per second. */
  speed?: number | null;
}

export interface SummaryPick {
  name: string;
  href: string | null;
  score: number;
  cost: number | null;
  time: number | null;
  speed: number | null;
}

export interface RankingSummary {
  /** Entries with a score. */
  count: number;
  leader: SummaryPick | null;
  /**
   * Best score per dollar ("ratio"), or the cheapest ("cheapest") for scales
   * such as Elo where a ratio means nothing, among the upper half.
   */
  value: SummaryPick | null;
  /** Fastest among the upper half, so a quick failure never wins. */
  fastest: SummaryPick | null;
  /** Number of entries the value and speed picks were chosen from. */
  pool: number;
}

export interface SummaryOptions {
  value?: "ratio" | "cheapest";
}

const finite = (value: number | null | undefined): value is number =>
  typeof value === "number" && Number.isFinite(value);

function pick(entry: SummaryEntry & { score: number }): SummaryPick {
  return {
    name: entry.name,
    href: entry.href ?? null,
    score: entry.score,
    cost: finite(entry.cost) ? entry.cost : null,
    time: finite(entry.time) ? entry.time : null,
    speed: finite(entry.speed) ? entry.speed : null,
  };
}

/** The upper half of a ranking, all of it when it is too short to split. */
export function upperHalf<T>(sorted: T[]): T[] {
  return sorted.length < 4 ? sorted : sorted.slice(0, Math.ceil(sorted.length / 2));
}

export function summarizeRanking(entries: SummaryEntry[], options: SummaryOptions = {}): RankingSummary {
  // Stable: ties keep the source order, which is the published ranking.
  const scored = entries
    .filter((entry): entry is SummaryEntry & { score: number } => finite(entry.score))
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => b.entry.score - a.entry.score || a.index - b.index)
    .map(({ entry }) => entry);
  const pool = upperHalf(scored);

  let value: (SummaryEntry & { score: number }) | null = null;
  if (options.value === "cheapest") {
    for (const entry of pool) {
      if (finite(entry.cost) && entry.cost >= 0 && (value === null || entry.cost < value.cost!)) value = entry;
    }
  } else {
    let best = -Infinity;
    for (const entry of pool) {
      // A free run has no meaningful ratio; it is left to the cheapest view.
      if (!finite(entry.cost) || entry.cost <= 0 || entry.score <= 0) continue;
      const ratio = entry.score / entry.cost;
      if (ratio > best) { best = ratio; value = entry; }
    }
  }

  let fastest: (SummaryEntry & { score: number }) | null = null;
  for (const entry of pool) {
    if (finite(entry.time) && entry.time > 0) {
      if (fastest === null || !finite(fastest.time) || entry.time < fastest.time) fastest = entry;
    } else if (finite(entry.speed) && entry.speed > 0 && !finite(fastest?.time)) {
      if (fastest === null || (finite(fastest.speed) && entry.speed > fastest.speed)) fastest = entry;
    }
  }

  return {
    count: scored.length,
    leader: scored[0] ? pick(scored[0]) : null,
    value: value ? pick(value) : null,
    fastest: fastest ? pick(fastest) : null,
    pool: pool.length,
  };
}

/** The most recent valid date among several, as an ISO string. */
export function latestDate(...values: Array<string | null | undefined>): string | null {
  let latest: number | null = null;
  for (const value of values) {
    const time = value ? Date.parse(value) : Number.NaN;
    if (Number.isFinite(time) && (latest === null || time > latest)) latest = time;
  }
  return latest === null ? null : new Date(latest).toISOString();
}
