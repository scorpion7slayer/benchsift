import "@tanstack/react-start/server-only";

import { cached } from "@/lib/revalidate-cache";

const DEEPSWE_ARTIFACT_BASE = "https://deepswe.datacurve.ai/artifacts";
const FETCH_TIMEOUT_MS = 8_000;
const CACHE_SECONDS = 21_600; // 6h

export type DeepSweVersion = "v1.1" | "v1";

const DEEPSWE_VERSIONS: Array<{
  id: DeepSweVersion;
  label: string;
  scoring: string;
}> = [
  { id: "v1.1", label: "DeepSWE v1.1", scoring: "node-id" },
  { id: "v1", label: "DeepSWE v1", scoring: "exit-code" },
];

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
  ci_half: number | null;
  ci_lo: number | null;
  ci_hi: number | null;
  ci_method: string | null;
  n_runs: number | null;
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
  version: DeepSweVersion;
  label: string;
  scoring: string;
  generated_at: string | null;
  latest_job: { name?: string; finished_at?: string } | null;
  n_tasks_in_set: number | null;
  scope: string | null;
  unit: string | null;
  rows: DeepSweRow[];
}

export interface DeepSweDeltaConfig {
  config: string;
  model: string;
  reasoning_effort: string | null;
  v1: number | null;
  current: number | null;
  delta: number | null;
  n_v1: number | null;
  n_current: number | null;
}

export interface DeepSweComparison {
  scope: string | null;
  compared_to: string | null;
  n_shared_configs: number | null;
  n_tasks: number | null;
  pooled: { v1: number | null; current: number | null };
  configs: DeepSweDeltaConfig[];
}

export interface DeepSweData {
  leaderboards: DeepSweLeaderboard[];
  comparison: DeepSweComparison | null;
}

type RawDeepSweLeaderboard = Partial<Omit<DeepSweLeaderboard, "rows">> & {
  rows?: Array<Partial<DeepSweRow>>;
};

type RawDeepSweComparison = Partial<Omit<DeepSweComparison, "configs" | "pooled">> & {
  pooled?: { v1?: unknown; current?: unknown };
  configs?: Array<Partial<DeepSweDeltaConfig>>;
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
    ci_half: num(row.ci_half),
    ci_lo: num(row.ci_lo),
    ci_hi: num(row.ci_hi),
    ci_method: str(row.ci_method),
    n_runs: num(row.n_runs),
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

function emptyLeaderboard(
  version: (typeof DEEPSWE_VERSIONS)[number],
): DeepSweLeaderboard {
  return {
    version: version.id,
    label: version.label,
    scoring: version.scoring,
    generated_at: null,
    latest_job: null,
    n_tasks_in_set: null,
    scope: null,
    unit: null,
    rows: [],
  };
}

async function fetchArtifact<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${DEEPSWE_ARTIFACT_BASE}/${path}.json`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "BenchSift/1.0 (+https://benchsift.nxtaigen.com)",
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    return res.ok ? (await res.json()) as T : null;
  } catch {
    return null;
  }
}

function normalizeLeaderboard(
  version: (typeof DEEPSWE_VERSIONS)[number],
  raw: RawDeepSweLeaderboard | null,
): DeepSweLeaderboard {
  if (!raw) return emptyLeaderboard(version);
  const rows = (raw.rows ?? [])
    .map(normalizeRow)
    .filter((row): row is DeepSweRow => row !== null)
    .sort((a, b) => (b.pass_at_1 ?? -1) - (a.pass_at_1 ?? -1));

  return {
    version: version.id,
    label: version.label,
    scoring: version.scoring,
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
}

function normalizeComparison(raw: RawDeepSweComparison | null): DeepSweComparison | null {
  if (!raw) return null;
  const configs = (raw.configs ?? [])
    .map((row): DeepSweDeltaConfig | null => {
      const config = str(row.config);
      const model = str(row.model);
      if (!config || !model) return null;
      return {
        config,
        model,
        reasoning_effort: str(row.reasoning_effort),
        v1: num(row.v1),
        current: num(row.current),
        delta: num(row.delta),
        n_v1: num(row.n_v1),
        n_current: num(row.n_current),
      };
    })
    .filter((row): row is DeepSweDeltaConfig => row !== null)
    .sort((a, b) => Math.abs(b.delta ?? 0) - Math.abs(a.delta ?? 0));

  return {
    scope: str(raw.scope),
    compared_to: str(raw.compared_to),
    n_shared_configs: num(raw.n_shared_configs),
    n_tasks: num(raw.n_tasks),
    pooled: {
      v1: num(raw.pooled?.v1),
      current: num(raw.pooled?.current),
    },
    configs,
  };
}

const getDeepSweDataCached = cached(
  async (): Promise<DeepSweData> => {
    const [v11, v1, delta] = await Promise.all([
      fetchArtifact<RawDeepSweLeaderboard>("v1.1/leaderboard-live"),
      fetchArtifact<RawDeepSweLeaderboard>("v1/leaderboard-live"),
      fetchArtifact<RawDeepSweComparison>("v1.1/v1-delta"),
    ]);
    return {
      leaderboards: [
        normalizeLeaderboard(DEEPSWE_VERSIONS[0], v11),
        normalizeLeaderboard(DEEPSWE_VERSIONS[1], v1),
      ],
      comparison: normalizeComparison(delta),
    };
  },
  ["deepswe-versioned-data"],
  { revalidate: CACHE_SECONDS },
);

export async function getDeepSweData(): Promise<DeepSweData> {
  return getDeepSweDataCached();
}
