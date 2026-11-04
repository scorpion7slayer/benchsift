/*
 * The data-generated summary of each benchmark page and of the home ranking:
 * which rows enter it, how their scores, costs and times read, and which date
 * the data carries. Shared by the route heads (descriptions) and the pages.
 */
import type { Aa3dData } from "@/lib/aa3d-data";
import type { RoboticsData } from "@/lib/aa-robotics-data";
import type { CyberLeaderboard } from "@/lib/cyber-index";
import { deepSweCatalogKey, deepSweFallbackName, type DeepSweModelInfo } from "@/lib/deepswe-catalog";
import type { DeepSweData } from "@/lib/deepswe-data";
import type { DecisionIndexModelInfo } from "@/lib/decision-index-catalog";
import type { DecisionIndexData } from "@/lib/decision-index-data";
import type { FrontierCodeModelInfo } from "@/lib/frontiercode-catalog";
import type { FrontierCodeData } from "@/lib/frontiercode-data";
import { summarizeRanking, type RankingSummary } from "@/lib/data-summary";
import { formatDuration, formatNumber, formatSeconds, formatPercent, formatSpeed, type DisplayLang } from "@/lib/format";

export interface BenchmarkSummary {
  /** Name the page and its description use for the benchmark. */
  benchmark: string;
  summary: RankingSummary;
  /** When the data was published or retrieved, ISO 8601; null when unknown. */
  updatedAt: string | null;
  /** Whether entries are models (the catalogue) or configurations (runs). */
  unit: "models" | "results";
  /** What a cost is for: a task, a scene, a million tokens. */
  costUnit: "perTask" | "perScene" | "perMillion";
  formatScore: (value: number, lang: DisplayLang) => string;
  /** What the score is, when the number alone does not say (on the page only). */
  scoreLabel?: string;
  formatSpeed: (pick: { time: number | null; speed: number | null }, lang: DisplayLang) => string | null;
}

const modelHref = (slug: string | null | undefined) => (slug ? `/models/${encodeURIComponent(slug)}` : null);
const percentOf100 = (value: number, lang: DisplayLang) => formatPercent(value / 100, lang);
// Below a minute, three significant digits: a 0.4 s task must not read "0 s".
const secondsPerTask = ({ time }: { time: number | null }, lang: DisplayLang) =>
  time == null ? null : time < 60 ? formatSeconds(time, lang) : formatDuration(time, lang);

export function frontierCodeSummary(data: FrontierCodeData & { catalog: Record<string, FrontierCodeModelInfo> }): BenchmarkSummary {
  return {
    benchmark: "FrontierCode",
    summary: summarizeRanking(data.rows.map((row) => ({
      name: row.name,
      href: modelHref(data.catalog[row.slug]?.slug),
      score: row.score,
      cost: row.cost_per_task_usd,
      time: row.time_per_task_seconds,
    }))),
    updatedAt: data.fetched_at ?? null,
    unit: "results",
    costUnit: "perTask",
    formatScore: (value, lang) => formatPercent(value, lang),
    formatSpeed: secondsPerTask,
  };
}

export function aa3dSummary(data: Aa3dData & { catalog: Record<string, FrontierCodeModelInfo> }): BenchmarkSummary {
  return {
    benchmark: "AA-3D",
    // An Elo has no zero, so a score-per-dollar ratio would mean nothing.
    summary: summarizeRanking(data.rows.map((row) => ({
      name: row.name,
      href: modelHref(data.catalog[row.slug]?.slug),
      score: row.elo,
      cost: row.cost_per_scene_usd,
    })), { value: "cheapest" }),
    updatedAt: data.fetched_at ?? null,
    unit: "results",
    costUnit: "perScene",
    formatScore: (value, lang) => `${formatNumber(value, lang, 0)} Elo`,
    formatSpeed: () => null,
  };
}

export function decisionIndexSummary(data: DecisionIndexData & { catalog: Record<string, DecisionIndexModelInfo> }): BenchmarkSummary {
  return {
    benchmark: "Decision Index",
    summary: summarizeRanking(data.rows.map((row) => ({
      name: row.name,
      href: modelHref(data.catalog[row.id]?.slug),
      score: row.index,
      cost: row.cost_per_task_usd,
      time: row.time_per_task_seconds,
    }))),
    updatedAt: data.fetched_at ?? null,
    unit: "results",
    costUnit: "perTask",
    formatScore: (value, lang) => formatNumber(value, lang, 1),
    formatSpeed: secondsPerTask,
  };
}

export function roboticsSummary(data: RoboticsData & { catalog: Record<string, FrontierCodeModelInfo> }): BenchmarkSummary {
  return {
    benchmark: "AA-Robotics",
    summary: summarizeRanking(data.rows.map((row) => ({
      name: row.harness ? `${row.name} (${row.harness})` : row.name,
      href: modelHref(data.catalog[row.slug]?.slug),
      score: row.score,
      cost: row.cost_per_task_usd,
      time: row.minutes_per_task == null ? null : row.minutes_per_task * 60,
    }))),
    updatedAt: data.fetched_at ?? null,
    unit: "results",
    costUnit: "perTask",
    formatScore: (value, lang) => formatNumber(value, lang, 1),
    formatSpeed: secondsPerTask,
  };
}

export function cyberSummary(data: CyberLeaderboard & { refreshed_at?: string | null }): BenchmarkSummary {
  return {
    benchmark: "Cyber Index",
    summary: summarizeRanking(data.rows.map((row) => ({
      name: row.name,
      href: modelHref(row.slug),
      score: row.result.score,
      cost: row.result.cost_per_task_usd,
    }))),
    updatedAt: data.refreshed_at ?? null,
    unit: "results",
    costUnit: "perTask",
    formatScore: percentOf100,
    formatSpeed: () => null,
  };
}

export function deepSweSummary(data: DeepSweData & { catalog: Record<string, DeepSweModelInfo> }): BenchmarkSummary {
  // The current version's leaderboard, the one the page opens on.
  const leaderboard = data.leaderboards[0];
  const rows = leaderboard?.rows ?? [];
  return {
    benchmark: "DeepSWE",
    summary: summarizeRanking(rows.map((row) => {
      const info = data.catalog[deepSweCatalogKey(row.model, row.reasoning_effort)];
      const name = info?.name ?? deepSweFallbackName(row.model);
      const detail = [row.reasoning_effort, row.harness].filter(Boolean).join(", ");
      return {
        name: detail ? `${name} (${detail})` : name,
        href: modelHref(info?.slug),
        score: row.pass_at_1,
        cost: row.mean_cost_usd,
        time: row.mean_duration_seconds,
      };
    })),
    updatedAt: leaderboard?.generated_at ?? leaderboard?.latest_job?.finished_at ?? null,
    unit: "results",
    costUnit: "perTask",
    formatScore: (value, lang) => `${formatPercent(value, lang)} pass@1`,
    formatSpeed: secondsPerTask,
  };
}

/** The home ranking: Intelligence Index, blended price, output speed. */
export function homeSummary(summary: RankingSummary, updatedAt: string | null): BenchmarkSummary {
  return {
    benchmark: "Intelligence Index",
    summary,
    updatedAt,
    unit: "models",
    costUnit: "perMillion",
    formatScore: (value, lang) => formatNumber(value, lang, 1),
    scoreLabel: "Intelligence Index",
    formatSpeed: ({ speed }, lang) => (speed == null ? null : formatSpeed(speed, lang)),
  };
}

