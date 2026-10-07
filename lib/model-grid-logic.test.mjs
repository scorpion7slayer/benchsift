import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";

import { createServer } from "vite";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
let server;
let logic;

before(async () => {
  server = await createServer({
    configFile: false,
    root: projectRoot,
    logLevel: "silent",
    resolve: { alias: { "@": projectRoot } },
    server: { middlewareMode: true },
  });
  logic = await server.ssrLoadModule("/lib/model-grid-logic.ts");
});

after(async () => {
  await server?.close();
});

function model(slug, overrides = {}) {
  return {
    id: slug,
    name: slug,
    slug,
    release_date: null,
    model_creator: { id: "test", name: "Test Lab", slug: "test" },
    evaluations: {
      artificial_analysis_intelligence_index: null,
      artificial_analysis_coding_index: null,
      artificial_analysis_math_index: null,
    },
    pricing: {
      price_1m_blended_3_to_1: null,
      price_1m_input_tokens: null,
      price_1m_output_tokens: null,
    },
    median_output_tokens_per_second: null,
    median_time_to_first_token_seconds: null,
    median_time_to_first_answer_token: null,
    output_modality_text: true,
    ...overrides,
  };
}

test("sorts advanced metrics in the expected direction and keeps missing values last", () => {
  const models = [
    model("middle", {
      evaluations: { artificial_analysis_intelligence_index: 50 },
      median_time_to_first_token_seconds: 2,
    }),
    model("missing"),
    model("best", {
      evaluations: { artificial_analysis_intelligence_index: 80 },
      median_time_to_first_token_seconds: 0.5,
    }),
  ];

  assert.deepEqual(
    logic.sortAdvancedModels(models, "intelligence").map(({ slug }) => slug),
    ["best", "middle", "missing"],
  );
  assert.deepEqual(
    logic.sortAdvancedModels(models, "ttft").map(({ slug }) => slug),
    ["best", "middle", "missing"],
  );
});

test("reverses any sort while keeping missing values last and ties stable", () => {
  const models = [
    model("b-tie", { name: "B tie", evaluations: { artificial_analysis_intelligence_index: 40 }, median_output_tokens_per_second: 100 }),
    model("none", { name: "None" }),
    model("slow", { name: "Slow", median_output_tokens_per_second: 20 }),
    model("a-tie", { name: "A tie", evaluations: { artificial_analysis_intelligence_index: 60 }, median_output_tokens_per_second: 100 }),
  ];
  assert.deepEqual(
    logic.sortAdvancedModels(models, "speed").map(({ slug }) => slug),
    ["a-tie", "b-tie", "slow", "none"],
  );
  assert.deepEqual(
    logic.sortAdvancedModels(models, "speed", "asc").map(({ slug }) => slug),
    ["slow", "a-tie", "b-tie", "none"],
  );
  assert.deepEqual(
    logic.sortAdvancedModels(models, "name", "desc").map(({ slug }) => slug),
    ["slow", "none", "b-tie", "a-tie"],
  );
  assert.equal(logic.DEFAULT_SORT_DIRECTION.price, "asc");
  assert.equal(logic.advancedSortValue(models[1], "speed"), null);
});

test("uses display pricing as the fallback for price sorting", () => {
  const models = [
    model("display", {
      pricing: {
        price_1m_blended_3_to_1: null,
        openrouter_display_prices: [
          { label: "A", price: 4, unit: "unit" },
          { label: "B", price: 2, unit: "unit" },
        ],
      },
    }),
    model("blended", {
      pricing: { price_1m_blended_3_to_1: 1 },
    }),
    model("missing"),
  ];

  assert.deepEqual(
    logic.sortAdvancedModels(models, "price").map(({ slug }) => slug),
    ["blended", "display", "missing"],
  );
  assert.deepEqual(
    logic.sortAdvancedModels(models, "price", "desc").map(({ slug }) => slug),
    ["display", "blended", "missing"],
  );
});

test("filters normal rankings, search tokens, weight access, and output categories", () => {
  const ranked = model("ranked", {
    evaluations: { artificial_analysis_intelligence_index: 70 },
  });
  const missing = model("missing");
  const speech = model("voice-model", {
    name: "Voice Model",
    model_creator: { id: "acme", name: "Acme Audio", slug: "acme" },
    output_modality_text: false,
    output_modality_speech: true,
  });

  assert.equal(logic.hasNormalRankingValue(ranked, "intelligence"), true);
  assert.equal(logic.hasNormalRankingValue(missing, "intelligence"), false);
  assert.equal(logic.matchesSearch(speech, "acme voice"), true);
  assert.equal(logic.matchesSearch(speech, "image"), false);
  assert.equal(logic.matchesWeightAccess(true, "all"), true);
  assert.equal(logic.matchesWeightAccess(true, "open"), true);
  assert.equal(logic.matchesWeightAccess(true, "closed"), false);
  assert.equal(logic.matchesWeightAccess(false, "closed"), true);
  assert.equal(logic.matchesCategory(speech, "audio"), true);
  assert.equal(logic.matchesCategory(speech, "image"), false);
});

test("keeps models with a Math score in the normal ranking", () => {
  const models = [
    model("lower-math", {
      evaluations: { artificial_analysis_math_index: 61.5 },
    }),
    model("missing-math"),
    model("higher-math", {
      evaluations: { artificial_analysis_math_index: 87.2 },
    }),
  ];

  assert.equal(logic.hasNormalRankingValue(models[0], "math"), true);
  assert.equal(logic.hasNormalRankingValue(models[1], "math"), false);
  assert.deepEqual(
    logic.sortHomeModels(models, "math").map(({ slug }) => slug),
    ["higher-math", "lower-math", "missing-math"],
  );
});

test("groups OpenRouter decision models in their own category", async () => {
  const metrics = await server.ssrLoadModule("/lib/model-metrics.ts");
  const decision = model("jev-1-13", {
    output_modality_text: false,
    input_modality_text: true,
    openrouter_input_modalities: ["text"],
    openrouter_output_modalities: ["decisions"],
  });
  const chat = model("chat-model", { openrouter_output_modalities: ["text"] });

  assert.equal(logic.matchesCategory(decision, "decisions"), true);
  assert.equal(logic.matchesCategory(decision, "text"), false);
  assert.equal(logic.matchesCategory(chat, "decisions"), false);
  assert.equal(metrics.getPrimaryCategory(decision), "decisions");
  assert.equal(metrics.isTextOutputModel(decision), false);
});

test("advanced thresholds exclude models without the measured value", () => {
  const none = { minScore: null, maxPrice: null, minContext: null, minSpeed: null, reasoning: "all" };
  const cheap = model("cheap", {
    evaluations: { artificial_analysis_intelligence_index: 45 },
    pricing: { price_1m_blended_3_to_1: 0.8 },
    context_window_tokens: 200_000,
    median_output_tokens_per_second: 120,
    reasoning_model: true,
  });
  const unknown = model("unknown");
  assert.equal(logic.matchesThresholds(cheap, none), true);
  assert.equal(logic.matchesThresholds(unknown, none), true);
  assert.equal(logic.matchesThresholds(cheap, { ...none, minScore: 40, maxPrice: 1, minContext: 128_000, minSpeed: 100 }), true);
  assert.equal(logic.matchesThresholds(cheap, { ...none, minScore: 50 }), false);
  assert.equal(logic.matchesThresholds(unknown, { ...none, maxPrice: 1 }), false);
  assert.equal(logic.matchesThresholds(cheap, { ...none, reasoning: "no" }), false);
  assert.equal(logic.matchesThresholds(unknown, { ...none, reasoning: "no" }), true);
});
