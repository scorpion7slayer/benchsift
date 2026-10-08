import assert from "node:assert/strict";
import test from "node:test";

import {
  cyberCounterparts,
  cyberLeaderboard,
  cyberOutcomeShares,
  parseCyberSearch,
  selectCyberRows,
} from "./cyber-index.ts";
import { buildHomeCatalogData } from "./home-catalog.ts";
import { buildComparisonRows } from "./comparison-rows.ts";
import { hasAnyBenchmarkData } from "./model-metrics.ts";
import { metricRanks } from "./model-insights.ts";

const result = (score, extra = {}) => ({
  version: "v1",
  score,
  safety_block_rate: 0,
  access: "standard",
  cost_per_task_usd: 1,
  benchmarks: [{ id: "cwe-bench-aa", label: "CWE-Bench-AA", score: score / 100, safety_blocks: false, cost_per_task_usd: 1 }],
  ...extra,
});

function model(slug, name, cyber, creator = "openai") {
  return {
    id: slug,
    slug,
    name,
    release_date: null,
    model_creator: { id: creator, name: creator, slug: creator },
    evaluations: cyber ? { cyber_index: cyber.score } : {},
    pricing: { price_1m_blended_3_to_1: null, price_1m_input_tokens: null, price_1m_output_tokens: null },
    median_output_tokens_per_second: null,
    median_time_to_first_token_seconds: null,
    median_time_to_first_answer_token: null,
    output_modality_text: true,
    ...(cyber ? { cyber_index_result: cyber } : {}),
  };
}

const catalogue = () => [
  model("gpt-6-sol-low", "GPT-6 Sol (Low)"),
  model("gpt-6-sol", "GPT-6 Sol (Max)", result(36.8, { safety_block_rate: 0.36 })),
  model("gpt-6-sol-daybreak-blue", "GPT-6 Sol (Daybreak Blue, max)", result(68.7, { access: "trusted" })),
  model("muse-spark-1-3", "Muse Spark 1.3", null, "meta"),
  model("muse-spark-1-3-xhigh", "Muse Spark 1.3 (Xhigh)", result(44.3), "meta"),
  model("tie", "Tie", result(44.3), "zai"),
  model("claude-opus-5-5", "Claude Opus 5.5 (Max, Default Fallback)", result(28.7), "anthropic"),
];

test("the leaderboard ranks measured configurations and tied scores share a rank", () => {
  const board = cyberLeaderboard(catalogue());
  assert.equal(board.version, "v1");
  assert.deepEqual(board.benchmarks, [{ id: "cwe-bench-aa", label: "CWE-Bench-AA" }]);
  assert.deepEqual(board.rows.map((row) => [row.slug, row.rank]), [
    ["gpt-6-sol-daybreak-blue", 1],
    ["muse-spark-1-3-xhigh", 2],
    ["tie", 2],
    ["gpt-6-sol", 4],
    ["claude-opus-5-5", 5],
  ]);
});

test("outcomes split the index into successes, safety blocks and failures", () => {
  const shares = cyberOutcomeShares({ score: 12.7, safety_block_rate: 0.568 });
  assert.equal(shares.successes, 0.127);
  assert.equal(shares.safetyBlocks, 0.568);
  assert.ok(Math.abs(shares.failures - 0.305) < 1e-9);
  assert.deepEqual(cyberOutcomeShares({ score: 40, safety_block_rate: null }), { successes: 0.4, safetyBlocks: null, failures: null });
  // Blocks never push the bar past 100 %.
  assert.ok(Math.abs(cyberOutcomeShares({ score: 80, safety_block_rate: 0.5 }).safetyBlocks - 0.2) < 1e-9);
});

test("a trusted-access configuration links to its public model and back", () => {
  const models = catalogue();
  const [low, sol, blue, , muse, , claude] = models;
  assert.deepEqual(cyberCounterparts(models, blue), [{ slug: "gpt-6-sol", name: "GPT-6 Sol (Max)", access: "standard", score: 36.8 }]);
  assert.deepEqual(cyberCounterparts(models, sol).map((item) => [item.slug, item.access]), [["gpt-6-sol-daybreak-blue", "trusted"]]);
  assert.deepEqual(cyberCounterparts(models, low).map((item) => item.slug), ["gpt-6-sol-daybreak-blue"]);
  // A qualifier alone, without AA's trusted-access status, links nothing.
  assert.deepEqual(cyberCounterparts(models, claude), []);
  assert.deepEqual(cyberCounterparts(models, muse), []);
});

test("Cyber page URL state keeps only valid values and omits defaults", () => {
  assert.deepEqual(parseCyberSearch({ q: "  sol ", access: "public", sort: "cwe-bench-aa", dir: "desc", chart: "cybergym-e2e-aa" }), {
    q: "sol",
    access: "public",
    sort: "cwe-bench-aa",
    chart: "cybergym-e2e-aa",
  });
  assert.deepEqual(parseCyberSearch({ access: "all", sort: "index", dir: "desc", chart: "cost" }), {});
  assert.deepEqual(parseCyberSearch({ sort: "blocks", dir: "desc" }), { sort: "blocks", dir: "desc" });
  assert.deepEqual(parseCyberSearch({ sort: "cost", dir: "asc", chart: "<script>" }), { sort: "cost" });
});

test("filters and sorts never renumber ranks and missing values sort last", () => {
  const { rows } = cyberLeaderboard(catalogue());
  const select = (options) => selectCyberRows(rows, { matches: () => true, publicOnly: false, sort: "index", direction: "desc", ...options });
  const publicRows = select({ publicOnly: true });
  assert.equal(publicRows.some((row) => row.result.access === "trusted"), false);
  assert.equal(publicRows[0].rank, 2);
  rows[1].result = { ...rows[1].result, cost_per_task_usd: null };
  for (const direction of ["asc", "desc"]) {
    assert.equal(select({ sort: "cost", direction }).at(-1).slug, rows[1].slug);
  }
  assert.deepEqual(select({ sort: "blocks", direction: "desc" }).map((row) => row.slug)[0], "gpt-6-sol");
});

test("the catalogue ranks the measured configuration, not the collapsed family", () => {
  const models = catalogue();
  const home = buildHomeCatalogData(models);
  assert.equal(home.models.some((row) => row.slug === "muse-spark-1-3-xhigh"), false);
  assert.deepEqual(home.cyberModels.map((row) => row.slug), [
    "gpt-6-sol",
    "gpt-6-sol-daybreak-blue",
    "muse-spark-1-3-xhigh",
    "tie",
    "claude-opus-5-5",
  ]);
  const blue = home.cyberModels.find((row) => row.slug === "gpt-6-sol-daybreak-blue");
  assert.equal(blue.access_restriction, "trusted_access");
  assert.equal(blue.evaluations.cyber_index, 68.7);

  const [, sol, daybreak] = models;
  assert.equal(hasAnyBenchmarkData(daybreak), true, "a Cyber-only model is not shown as unmeasured");
  assert.deepEqual(metricRanks(models, sol).cyber_index, { rank: 4, total: 5 });
});

test("comparisons show the Cyber Index, its benchmarks and safety blocks without a better direction", () => {
  const [, sol, blue] = catalogue();
  const labels = new Proxy({}, { get: (_, key) => (typeof key === "string" ? key : undefined) });
  const t = { benchmarks: labels, compare: { fields: labels }, glossary: labels, detail: labels, grid: { availability: labels }, card: labels };
  const rows = buildComparisonRows([sol, blue], t, "en");
  const byId = new Map(rows.map((row) => [row.id, row]));
  assert.deepEqual(byId.get("cyber_index").values, [36.8, 68.7]);
  assert.equal(byId.get("cyber_index").format, "points");
  assert.deepEqual(byId.get("cyber:cwe-bench-aa").values, [0.368, 0.687]);
  assert.deepEqual(byId.get("cyber-safety-blocks").values, [0.36, 0]);
  assert.equal(byId.get("cyber-safety-blocks").direction, undefined);
  assert.deepEqual(byId.get("availability").values, [null, "trustedAccessBadge"]);
  assert.equal(byId.get("availability").essential, true);
});
