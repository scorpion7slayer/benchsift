import assert from "node:assert/strict";
import test from "node:test";

import { mergeAACyberIndex, parseAACyberIndex } from "./aa-cyber.ts";

const SOL = "c50ea08c-88c0-4eb7-85b8-27f2bbf6d527";
const BLUE = "93e12518-6e04-4713-b52d-2c56dac49c63";
const element = (type, props) => ["$", type, null, props];

/** The shape AA's home page sends: inline and lazy (`$L`) tab panels across Flight records. */
function payload({ indexModels, breakdown, costs }) {
  const lines = {
    53: [element("$L46", {
      param: "cyber-index",
      tabs: [
        {
          value: "cyber-index",
          label: "Cyber Index",
          panel: element("$L65", {
            evalSlug: "artificial-analysis-cyber-index",
            indexSubtitle: "Artificial Analysis Cyber Index v1 incorporates 3 evaluations: CWE-Bench-AA, DeepsecBench-AA, and CyberGym-E2E-AA",
            models: indexModels,
          }),
        },
        { value: "cyber-index-by-benchmark", label: "Cyber Index by Benchmark", panel: "$L66" },
      ],
    })],
    66: element("$L9d", { models: breakdown, messages: {} }),
    67: element("$L46", {
      param: "cyber-index-cost",
      tabs: [
        { value: "cyber-index-vs-cost-per-task", label: "Cyber Index vs. Cost per Task", panel: "$L9e" },
        { value: "cwe-bench-aa-vs-cost-per-task", label: "CWE-Bench-AA vs. Cost per Task", panel: "$L9f" },
        { value: "cybergym-e2e-aa-vs-cost-per-task", label: "CyberGym-E2E-AA vs. Cost per Task", panel: "$La1" },
      ],
    }),
    "9e": element("$L9e", { evalSlug: "artificial-analysis-cyber-index", models: costs.index, allModels: "$9e:props:models" }),
    "9f": element("$L9e", { evalSlug: "cwe-bench-aa", models: costs.cwe, messages: "$66:props:messages" }),
    a1: element("$L9e", { evalSlug: "cybergym-e2e-aa", models: costs.gym }),
  };
  return [
    '1:"$Sreact.fragment"',
    '9d:I[60414,["static/chunks/a.js"],"CyberIndexScoreByBenchmarkClusteredBarChartBase"]',
    ...Object.entries(lines).map(([id, value]) => `${id}:${JSON.stringify(value)}`),
    "2a:T12,not json at all",
  ].join("\n");
}

const sample = () => payload({
  indexModels: [
    { id: SOL, slug: "gpt-6-sol", name: "GPT-6 Sol (Max)", score: 36.8, refusalRate: 0.364, mitigationStatus: "standard" },
    { id: BLUE, slug: "gpt-6-sol-daybreak-blue", name: "GPT-6 Sol (Daybreak Blue, max)", score: 68.7, refusalRate: 0, mitigationStatus: "unmitigated" },
    { id: "too-high", slug: "too-high", name: "Too high", score: 120, refusalRate: 0, mitigationStatus: "standard" },
    { id: "bad-slug", slug: "../escape", name: "Bad slug", score: 10, refusalRate: 0, mitigationStatus: "standard" },
    { slug: "no-id", name: "No id", score: 10 },
    { id: "odd", modelUrl: "/models/odd-model", name: "Odd", score: 5, refusalRate: 3, mitigationStatus: "experimental" },
  ],
  breakdown: [
    {
      id: SOL,
      evalScores: { "cwe-bench-aa": 0.64, "deepsecbench-aa": 0.46, "cybergym-e2e-aa": 0 },
      evalHasRefusals: { "cwe-bench-aa": true, "deepsecbench-aa": false, "cybergym-e2e-aa": true },
      mitigationStatus: "standard",
    },
    {
      id: BLUE,
      evalScores: { "cwe-bench-aa": 0.65, "deepsecbench-aa": 0.48, "cybergym-e2e-aa": 0.93 },
      evalHasRefusals: { "cwe-bench-aa": false, "deepsecbench-aa": false, "cybergym-e2e-aa": false },
      mitigationStatus: "unmitigated",
    },
  ],
  costs: {
    index: [{ id: SOL, score: 36.8, costPerTask: 1.96 }, { id: BLUE, score: 68.7, costPerTask: -1 }],
    cwe: [{ id: SOL, score: 0.64, costPerTask: 1.94 }, { id: BLUE, score: 0.65, costPerTask: 2.01 }],
    gym: [{ id: SOL, score: 0, costPerTask: 1.98 }, { id: BLUE, score: 0.93, costPerTask: 1.53 }],
  },
});

test("Cyber Index keeps safety blocks, trusted access, zero scores and AA benchmark names", () => {
  const entries = parseAACyberIndex(sample());
  assert.deepEqual(entries.map((entry) => entry.slug), ["gpt-6-sol", "gpt-6-sol-daybreak-blue", "odd-model"]);
  const [sol, blue, odd] = entries;

  assert.equal(sol.aa_id, SOL);
  assert.equal(sol.version, "v1");
  assert.equal(sol.access, "standard");
  assert.equal(sol.safety_block_rate, 0.364);
  assert.equal(sol.cost_per_task_usd, 1.96);
  // Cost tabs give the order and names; a benchmark without a cost tab keeps its id.
  assert.deepEqual(sol.benchmarks.map((benchmark) => [benchmark.id, benchmark.label]), [
    ["cwe-bench-aa", "CWE-Bench-AA"],
    ["cybergym-e2e-aa", "CyberGym-E2E-AA"],
    ["deepsecbench-aa", "deepsecbench-aa"],
  ]);
  const gym = sol.benchmarks.find((benchmark) => benchmark.id === "cybergym-e2e-aa");
  assert.deepEqual(gym, { id: "cybergym-e2e-aa", label: "CyberGym-E2E-AA", score: 0, safety_blocks: true, cost_per_task_usd: 1.98 });
  assert.equal(sol.benchmarks.find((benchmark) => benchmark.id === "deepsecbench-aa").cost_per_task_usd, null);

  assert.equal(blue.access, "trusted");
  assert.equal(blue.safety_block_rate, 0);
  assert.equal(blue.cost_per_task_usd, null, "a negative cost is not a measurement");

  // Unknown statuses and out-of-range rates stay unknown rather than guessed.
  assert.equal(odd.access, null);
  assert.equal(odd.safety_block_rate, null);
  assert.deepEqual(odd.benchmarks, []);
});

test("Cyber Index is empty when AA no longer publishes the section", () => {
  assert.deepEqual(parseAACyberIndex('0:["$","div",null,{"param":"speed","tabs":[]}]'), []);
  assert.deepEqual(parseAACyberIndex("not a flight payload"), []);
});

test("Cyber Index results attach by AA id, then by slug for AA rows only", () => {
  const entries = parseAACyberIndex(sample());
  const catalogue = [
    { id: SOL, slug: "gpt-6-sol", name: "GPT-6 Sol (Max)", evaluations: { artificial_analysis_intelligence_index: 47.6 } },
    { id: "openrouter:openai/gpt-6-sol-daybreak-blue", slug: "gpt-6-sol-daybreak-blue", name: "Daybreak", evaluations: {} },
    { id: "odd-model", slug: "odd-model", name: "Odd", evaluations: {} },
  ];
  const { models, matched } = mergeAACyberIndex(catalogue, entries);
  assert.equal(matched, 2);
  assert.equal(models.length, catalogue.length, "a chart entry never creates a model");
  assert.equal(models[0].evaluations.cyber_index, 36.8);
  assert.equal(models[0].evaluations.artificial_analysis_intelligence_index, 47.6);
  assert.equal(models[0].cyber_index_result.safety_block_rate, 0.364);
  assert.equal("aa_id" in models[0].cyber_index_result, false);
  assert.equal(models[1].cyber_index_result, undefined, "an OpenRouter row is not matched by slug alone");
  assert.equal(models[2].evaluations.cyber_index, 5);
  assert.equal(catalogue[0].cyber_index_result, undefined, "input models are not mutated");
});
