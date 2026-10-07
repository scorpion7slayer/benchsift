import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";

import { createServer } from "vite";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
let server;
let insights;
let reasoning;

before(async () => {
  server = await createServer({
    configFile: false,
    root: projectRoot,
    logLevel: "silent",
    resolve: { alias: { "@": projectRoot } },
    server: { middlewareMode: true },
  });
  insights = await server.ssrLoadModule("/lib/model-insights.ts");
  reasoning = await server.ssrLoadModule("/lib/model-reasoning.ts");
});

after(async () => {
  await server?.close();
});

function model(slug, { name = slug, creator = "lab", intelligence = null, price = null, speed = null, indexCost = null } = {}) {
  return {
    id: slug,
    name,
    slug,
    release_date: null,
    model_creator: { id: creator, name: creator.toUpperCase(), slug: creator },
    evaluations: { artificial_analysis_intelligence_index: intelligence },
    pricing: { price_1m_blended_3_to_1: price, price_1m_input_tokens: null, price_1m_output_tokens: null },
    median_output_tokens_per_second: speed,
    median_time_to_first_token_seconds: null,
    intelligence_index_cost_usd: indexCost,
    output_modality_text: true,
  };
}

test("ranks a model among measured models, best first, sharing ties", () => {
  const models = [
    model("a", { intelligence: 70, price: 10 }),
    model("b", { intelligence: 60, price: 2 }),
    model("c", { intelligence: 60, price: null }),
    model("d", { intelligence: null, price: 5 }),
  ];
  const ranksOfC = insights.metricRanks(models, models[2]);
  assert.deepEqual(ranksOfC.artificial_analysis_intelligence_index, { rank: 2, total: 3 });
  assert.equal(ranksOfC.price, undefined);
  // Price ranks the cheapest first.
  assert.deepEqual(insights.metricRanks(models, models[1]).price, { rank: 1, total: 3 });
  assert.deepEqual(insights.metricRanks(models, models[0]).price, { rank: 3, total: 3 });
});

test("plots each reasoning level of a family with sourced values only", () => {
  const models = [
    model("sol-low", { name: "Sol (low)", intelligence: 40, indexCost: 100 }),
    model("sol", { name: "Sol (high)", intelligence: 55, indexCost: 900 }),
  ];
  const family = reasoning.getModelReasoningFamily(models, "sol");
  const points = insights.familyPoints(family);
  assert.deepEqual(points.map((point) => [point.slug, point.effort, point.scores.intelligence, point.axes.index_cost]), [
    ["sol-low", "low", 40, 100],
    ["sol", "high", 55, 900],
  ]);
  assert.equal(points[0].axes.cost_per_task, null);
  assert.equal(points[0].scores.coding, null);
});

test("suggests the closest models outside the family, one per family", () => {
  const models = [
    model("target", { intelligence: 50 }),
    model("target-low", { name: "target (low)", intelligence: 49 }),
    model("near", { intelligence: 52, creator: "other" }),
    model("near-low", { name: "near (low)", intelligence: 51, creator: "other" }),
    model("far", { intelligence: 20, creator: "third" }),
    model("unscored", { creator: "fourth" }),
  ];
  const similar = insights.similarModels(models, models[0], new Set(["target", "target-low"]), 2);
  assert.deepEqual(similar.map((entry) => entry.slug), ["near", "far"]);
  assert.equal(insights.similarModels(models, models[5], new Set(), 2).length, 0);
  const listedTwice = [
    model("target", { intelligence: 50 }),
    model("twin", { intelligence: 52, creator: "other" }),
    model("twin-batch", { name: "twin (batch)", intelligence: 52, creator: "other" }),
    model("next", { intelligence: 47, creator: "third" }),
  ];
  assert.deepEqual(
    insights.similarModels(listedTwice, listedTwice[0], new Set(["target"]), 2).map((entry) => entry.slug),
    ["twin", "next"],
  );
});

test("groups efforts written beside another qualifier, e.g. (Max, Default Fallback)", () => {
  const models = [
    model("opus-max", { name: "Claude Opus 5.5 (Max, Default Fallback)", intelligence: 60 }),
    model("opus-high", { name: "Claude Opus 5.5 (High, Default Fallback)", intelligence: 55 }),
  ];
  const family = reasoning.getModelReasoningFamily(models, "opus-max");
  assert.equal(family.familyName, "Claude Opus 5.5 (Default Fallback)");
  assert.deepEqual(family.variants.map(({ descriptor }) => descriptor.effort), ["high", "max"]);
  assert.equal(reasoning.collapseReasoningVariants(models).length, 1);
});
