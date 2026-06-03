import "@tanstack/react-start/server-only";

import { cached } from "@/lib/revalidate-cache";

const DEEPSWE_LEADERBOARD_URL =
  "https://deepswe.datacurve.ai/artifacts/leaderboard-live.json";
const FETCH_TIMEOUT_MS = 8_000;
const CACHE_SECONDS = 21_600; // 6h

export interface DeepSweRow {
  model: string;
  harness: string;
  reasoning_effort: string | null;
  config: string;
  source: string;
  pass_rate: number | null;
  pass_at_1: number | null;
  pass_at_4: number | null;
  n_passed: number | null;
  n_attempted: number | null;
  n_tasks_attempted: number | null;
  n_tasks_passed_any: number | null;
  ci_passed: number | null;
  ci_attempted: number | null;
  mean_cost_usd: number | null;
  median_cost_usd: number | null;
  mean_output_tokens: number | null;
  median_output_tokens: number | null;
  mean_input_tokens: number | null;
  median_input_tokens: number | null;
  mean_duration_seconds: number | null;
  median_duration_seconds: number | null;
  mean_agent_steps: number | null;
  median_agent_steps: number | null;
  median_peak_context_tokens: number | null;
  median_output_tokens_to_pass: number | null;
}

export interface DeepSweLeaderboard {
  generated_at: string | null;
  latest_job: { name?: string; finished_at?: string } | null;
  n_tasks_in_set: number | null;
  scope: string | null;
  unit: string | null;
  rows: DeepSweRow[];
}

type RawDeepSweLeaderboard = Partial<Omit<DeepSweLeaderboard, "rows">> & {
  rows?: Array<Partial<DeepSweRow>>;
};

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function str(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function normalizeRow(row: Partial<DeepSweRow>): DeepSweRow | null {
  const model = str(row.model);
  if (!model) return null;

  return {
    model,
    harness: str(row.harness) ?? "mini-swe-agent",
    reasoning_effort: str(row.reasoning_effort),
    config: str(row.config) ?? model,
    source: str(row.source) ?? "deep-swe",
    pass_rate: num(row.pass_rate),
    pass_at_1: num(row.pass_at_1),
    pass_at_4: num(row.pass_at_4),
    n_passed: num(row.n_passed),
    n_attempted: num(row.n_attempted),
    n_tasks_attempted: num(row.n_tasks_attempted),
    n_tasks_passed_any: num(row.n_tasks_passed_any),
    ci_passed: num(row.ci_passed),
    ci_attempted: num(row.ci_attempted),
    mean_cost_usd: num(row.mean_cost_usd),
    median_cost_usd: num(row.median_cost_usd),
    mean_output_tokens: num(row.mean_output_tokens),
    median_output_tokens: num(row.median_output_tokens),
    mean_input_tokens: num(row.mean_input_tokens),
    median_input_tokens: num(row.median_input_tokens),
    mean_duration_seconds: num(row.mean_duration_seconds),
    median_duration_seconds: num(row.median_duration_seconds),
    mean_agent_steps: num(row.mean_agent_steps),
    median_agent_steps: num(row.median_agent_steps),
    median_peak_context_tokens: num(row.median_peak_context_tokens),
    median_output_tokens_to_pass: num(row.median_output_tokens_to_pass),
  };
}

function emptyLeaderboard(): DeepSweLeaderboard {
  return {
    generated_at: null,
    latest_job: null,
    n_tasks_in_set: null,
    scope: null,
    unit: null,
    rows: [],
  };
}

const getDeepSweLeaderboardCached = cached(
  async (): Promise<DeepSweLeaderboard> => {
    try {
      const res = await fetch(DEEPSWE_LEADERBOARD_URL, {
        headers: {
          "Accept": "application/json",
          "User-Agent": "BenchSift/1.0 (+https://benchsift.nxtaigen.com)",
        },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      if (!res.ok) return emptyLeaderboard();

      const raw = (await res.json()) as RawDeepSweLeaderboard;
      const rows = (raw.rows ?? [])
        .map(normalizeRow)
        .filter((row): row is DeepSweRow => row !== null)
        .sort((a, b) => (b.pass_at_1 ?? -1) - (a.pass_at_1 ?? -1));

      return {
        generated_at: str(raw.generated_at),
        latest_job:
          raw.latest_job && typeof raw.latest_job === "object"
            ? raw.latest_job
            : null,
        n_tasks_in_set: num(raw.n_tasks_in_set),
        scope: str(raw.scope),
        unit: str(raw.unit),
        rows,
      };
    } catch {
      return emptyLeaderboard();
    }
  },
  ["deepswe-leaderboard"],
  { revalidate: CACHE_SECONDS },
);

export async function getDeepSweLeaderboard(): Promise<DeepSweLeaderboard> {
  return getDeepSweLeaderboardCached();
}
