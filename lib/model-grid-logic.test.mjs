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

test("sorts nerd metrics in the expected direction and keeps missing values last", () => {
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
    logic.sortNerdModels(models, "intelligence").map(({ slug }) => slug),
    ["best", "middle", "missing"],
  );
  assert.deepEqual(
    logic.sortNerdModels(models, "ttft").map(({ slug }) => slug),
    ["best", "middle", "missing"],
  );
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
    logic.sortNerdModels(models, "price_asc").map(({ slug }) => slug),
    ["blended", "display", "missing"],
  );
  assert.deepEqual(
    logic.sortNerdModels(models, "price_desc").map(({ slug }) => slug),
    ["display", "blended", "missing"],
  );
});

test("filters normal rankings, search tokens, and output categories", () => {
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
  assert.equal(logic.matchesCategory(speech, "audio"), true);
  assert.equal(logic.matchesCategory(speech, "image"), false);
});
