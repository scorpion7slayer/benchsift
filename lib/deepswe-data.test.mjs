import assert from "node:assert/strict";
import test from "node:test";
import {
  DEEPSWE_VERSIONS,
  normalizeLeaderboard,
  normalizeComparison,
  selectDeepSweRows,
} from "./deepswe-data.ts";

const normalize = (rows) => normalizeLeaderboard(DEEPSWE_VERSIONS[0], { rows });
test("DeepSWE preserves zeros and missing provenance, validates scores and does not invent run counts", () => {
  const { rows } = normalize([
    null,
    {},
    {
      model: "test",
      pass_at_1: 0,
      pass_at_4: 1.1,
      mean_cost_usd: 0,
      mean_duration_seconds: -1,
      n_attempted: 452,
      cost_basis: "Source pricing assumption",
    },
  ]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].pass_at_1, 0);
  assert.equal(rows[0].pass_at_4, null);
  assert.equal(rows[0].mean_cost_usd, 0);
  assert.equal(rows[0].mean_duration_seconds, null);
  assert.equal(rows[0].n_runs, null);
  assert.equal(rows[0].harness, null);
  assert.equal(rows[0].provider, null);
  assert.equal(rows[0].source, null);
  assert.equal(rows[0].cost_basis, "Source pricing assumption");
  assert.deepEqual(
    normalizeLeaderboard(DEEPSWE_VERSIONS[0], { rows: "bad" }).rows,
    [],
  );
});

test("best DeepSWE effort retains different harnesses and providers, filters after grouping and never mutates source order", () => {
  const rows = normalize([
    {
      model: "test",
      config: "low",
      provider: "lab",
      harness: "one",
      reasoning_effort: "low",
      pass_at_1: 0.4,
      mean_cost_usd: 0,
    },
    {
      model: "test",
      config: "high",
      provider: "lab",
      harness: "one",
      reasoning_effort: "high",
      pass_at_1: 0.8,
      mean_cost_usd: 2,
    },
    {
      model: "test",
      config: "harness",
      provider: "lab",
      harness: "two",
      pass_at_1: 0.6,
    },
    {
      model: "test",
      config: "provider",
      provider: "other",
      harness: "one",
      pass_at_1: 0.5,
      mean_cost_usd: 1,
    },
  ]).rows;
  const before = rows.map((row) => row.config);
  const select = (options) =>
    selectDeepSweRows(rows, {
      query: "",
      bestOnly: true,
      sort: "score",
      ...options,
    }).map((row) => row.config);
  assert.deepEqual(select({}), ["high", "harness", "provider"]);
  assert.deepEqual(select({ query: " low " }), []);
  assert.deepEqual(select({ bestOnly: false, query: " low " }), ["low"]);
  assert.deepEqual(select({ sort: "cost" }), ["provider", "high", "harness"]);
  assert.deepEqual(select({ sort: "cost", bestOnly: false }), [
    "low",
    "provider",
    "high",
    "harness",
  ]);
  assert.deepEqual(
    rows.map((row) => row.config),
    before,
  );
});

test("historical DeepSWE comparisons preserve negative deltas without mixing version scores", () => {
  const result = normalizeComparison({
    configs: [
      null,
      { config: "test", model: "test", v1: 0.7, current: 0.5, delta: -0.2 },
    ],
    pooled: { v1: 0, current: 2 },
  });
  assert.equal(result.configs[0].delta, -0.2);
  assert.equal(result.configs[0].current, 0.5);
  assert.equal(result.pooled.v1, 0);
  assert.equal(result.pooled.current, null);
  assert.equal(
    normalizeLeaderboard(DEEPSWE_VERSIONS[1], { rows: [] }).version,
    "v1",
  );
});
