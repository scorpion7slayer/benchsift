import assert from "node:assert/strict";
import test from "node:test";

import {
  comparePairPath,
  parseComparePair,
  popularComparePairs,
  popularPairModels,
  popularPairOrder,
  relatedComparePairs,
} from "./compare-pairs.ts";

function model(slug, rank, overrides = {}) {
  return {
    id: slug,
    slug,
    name: slug.toUpperCase(),
    model_creator: { id: "c", name: "Creator", slug: "creator" },
    openrouter_weekly_rank: rank,
    evaluations: { artificial_analysis_intelligence_index: 50 },
    pricing: { price_1m_blended_3_to_1: 1 },
    median_output_tokens_per_second: 100,
    median_time_to_first_token_seconds: 1,
    input_modalities: ["text"],
    output_modalities: ["text"],
    ...overrides,
  };
}

test("pair addresses split on the separator that names two known models", () => {
  const known = new Set(["gpt-5", "model-vs-x", "claude"]);
  const isKnown = (slug) => known.has(slug);
  assert.deepEqual(parseComparePair("gpt-5-vs-claude", isKnown), ["gpt-5", "claude"]);
  assert.deepEqual(parseComparePair("model-vs-x-vs-claude", isKnown), ["model-vs-x", "claude"]);
  assert.equal(parseComparePair("gpt-5-vs-gpt-5", isKnown), null);
  assert.equal(parseComparePair("gpt-5-vs-nope", isKnown), null);
  assert.equal(parseComparePair("gpt-5", isKnown), null);
  assert.equal(comparePairPath("a", "b"), "/compare/a-vs-b");
});

test("popular pairs come from the weekly ranking and need comparable data", () => {
  const models = [
    model("c", 3),
    model("a", 1),
    model("unranked", null),
    model("no-price", 2, { pricing: { price_1m_blended_3_to_1: null } }),
    model("b", 5),
  ];
  assert.deepEqual(popularPairModels(models).map((m) => m.slug), ["a", "c", "b"]);
  const pairs = popularComparePairs(models);
  assert.deepEqual(pairs.map((p) => `${p.a.slug}/${p.b.slug}`), ["a/c", "a/b", "c/b"]);
  assert.deepEqual(popularPairOrder(pairs, "b", "a"), ["a", "b"]);
  assert.equal(popularPairOrder(pairs, "a", "unranked"), null);
  assert.deepEqual(relatedComparePairs(pairs, "a", "c").map((p) => `${p.a.slug}/${p.b.slug}`), ["a/b", "c/b"]);
});
