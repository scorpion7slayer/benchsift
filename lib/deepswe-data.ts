export type DeepSweVersion = "v1.1" | "v1";

export const DEEPSWE_VERSIONS: Array<{
  id: DeepSweVersion;
  label: string;
  scoring: string;
}> = [
  { id: "v1.1", label: "DeepSWE v1.1", scoring: "node-id" },
  { id: "v1", label: "DeepSWE v1", scoring: "exit-code" },
];

export interface DeepSweRow {
  model: string;
  harness: string | null;
  provider: string | null;
  cost_basis: string | null;
  reasoning_effort: string | null;
  config: string;
  source: string | null;
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

type RawDeepSweComparison = Partial<
  Omit<DeepSweComparison, "configs" | "pooled">
> & {
  pooled?: { v1?: unknown; current?: unknown };
  configs?: Array<Partial<DeepSweDeltaConfig>>;
};

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function nonnegative(value: unknown): number | null {
  const result = num(value);
  return result !== null && result >= 0 ? result : null;
}

function fraction(value: unknown): number | null {
  const result = num(value);
  return result !== null && result >= 0 && result <= 1 ? result : null;
}

function str(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function normalizeRow(row: Partial<DeepSweRow>): DeepSweRow | null {
  if (!row || typeof row !== "object") return null;
  const model = str(row.model);
  if (!model) return null;

  return {
    model,
    harness: str(row.harness),
    provider: str(row.provider),
    cost_basis: str(row.cost_basis),
    reasoning_effort: str(row.reasoning_effort),
    config: str(row.config) ?? model,
    source: str(row.source),
    pass_rate: fraction(row.pass_rate),
    pass_at_1: fraction(row.pass_at_1),
    pass_at_4: fraction(row.pass_at_4),
    n_passed: nonnegative(row.n_passed),
    n_attempted: nonnegative(row.n_attempted),
    n_tasks_attempted: nonnegative(row.n_tasks_attempted),
    n_tasks_passed_any: nonnegative(row.n_tasks_passed_any),
    ci_passed: nonnegative(row.ci_passed),
    ci_attempted: nonnegative(row.ci_attempted),
    ci_half: fraction(row.ci_half),
    ci_lo: fraction(row.ci_lo),
    ci_hi: fraction(row.ci_hi),
    ci_method: str(row.ci_method),
    n_runs: nonnegative(row.n_runs),
    mean_cost_usd: nonnegative(row.mean_cost_usd),
    median_cost_usd: nonnegative(row.median_cost_usd),
    mean_output_tokens: nonnegative(row.mean_output_tokens),
    median_output_tokens: nonnegative(row.median_output_tokens),
    mean_input_tokens: nonnegative(row.mean_input_tokens),
    median_input_tokens: nonnegative(row.median_input_tokens),
    mean_duration_seconds: nonnegative(row.mean_duration_seconds),
    median_duration_seconds: nonnegative(row.median_duration_seconds),
    mean_agent_steps: nonnegative(row.mean_agent_steps),
    median_agent_steps: nonnegative(row.median_agent_steps),
    median_peak_context_tokens: nonnegative(row.median_peak_context_tokens),
    median_output_tokens_to_pass: nonnegative(row.median_output_tokens_to_pass),
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

export function normalizeLeaderboard(
  version: (typeof DEEPSWE_VERSIONS)[number],
  raw: RawDeepSweLeaderboard | null,
): DeepSweLeaderboard {
  if (!raw) return emptyLeaderboard(version);
  const rows = (Array.isArray(raw.rows) ? raw.rows : [])
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
    n_tasks_in_set: nonnegative(raw.n_tasks_in_set),
    scope: str(raw.scope),
    unit: str(raw.unit),
    rows,
  };
}

export function normalizeComparison(
  raw: RawDeepSweComparison | null,
): DeepSweComparison | null {
  if (!raw) return null;
  const configs = (Array.isArray(raw.configs) ? raw.configs : [])
    .map((row): DeepSweDeltaConfig | null => {
      if (!row || typeof row !== "object") return null;
      const config = str(row.config);
      const model = str(row.model);
      if (!config || !model) return null;
      return {
        config,
        model,
        reasoning_effort: str(row.reasoning_effort),
        v1: fraction(row.v1),
        current: fraction(row.current),
        delta: num(row.delta),
        n_v1: nonnegative(row.n_v1),
        n_current: nonnegative(row.n_current),
      };
    })
    .filter((row): row is DeepSweDeltaConfig => row !== null)
    .sort((a, b) => Math.abs(b.delta ?? 0) - Math.abs(a.delta ?? 0));

  return {
    scope: str(raw.scope),
    compared_to: str(raw.compared_to),
    n_shared_configs: nonnegative(raw.n_shared_configs),
    n_tasks: nonnegative(raw.n_tasks),
    pooled: {
      v1: fraction(raw.pooled?.v1),
      current: fraction(raw.pooled?.current),
    },
    configs,
  };
}

export type DeepSweSort = "score" | "cost" | "time";

export function selectDeepSweRows(
  rows: DeepSweRow[],
  options: { query: string; bestOnly: boolean; sort: DeepSweSort },
) {
  const ranked = [...rows].sort(
    (a, b) => (b.pass_at_1 ?? -1) - (a.pass_at_1 ?? -1),
  );
  const seen = new Set<string>();
  const selected = ranked
    .filter((row) => {
      const identity = JSON.stringify([row.provider, row.model, row.harness]);
      if (options.bestOnly && seen.has(identity)) return false;
      seen.add(identity);
      return true;
    })
    .filter((row) =>
      `${row.model} ${row.harness ?? ""} ${row.reasoning_effort ?? ""}`
        .toLowerCase()
        .includes(options.query.trim().toLowerCase()),
    );
  if (options.sort !== "score") {
    const key =
      options.sort === "cost" ? "mean_cost_usd" : "mean_duration_seconds";
    selected.sort((a, b) => (a[key] ?? Infinity) - (b[key] ?? Infinity));
  }
  return selected;
}
