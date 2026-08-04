import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import test from "node:test";

const repositoryRoot = new URL("../", import.meta.url);

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      return {
        shortCircuit: true,
        url: new URL(`${specifier.slice(2)}.ts`, repositoryRoot).href,
      };
    }
    return nextResolve(specifier, context);
  },
});

const {
  collectAAPaginatedData,
  normaliseAAV2LanguageModel,
  normaliseAAV2LanguageModels,
} = await import("./aa-v2.ts");

test("collects every page from the paginated V2 language model endpoint", async () => {
  const requested = [];
  const rows = await collectAAPaginatedData(
    "/language/models/free?prompt_type=long",
    {
      data: ["page-1"],
      pagination: {
        page: 1,
        page_size: 1,
        total_pages: 3,
        has_more: true,
      },
    },
    async (endpoint) => {
      requested.push(endpoint);
      const page = Number(new URL(endpoint, "https://example.com").searchParams.get("page"));
      return {
        data: [`page-${page}`],
        pagination: {
          page,
          page_size: 1,
          total_pages: 3,
          has_more: page < 3,
        },
      };
    },
  );

  assert.deepEqual(rows, ["page-1", "page-2", "page-3"]);
  assert.deepEqual(requested, [
    "/language/models/free?prompt_type=long&page=2",
    "/language/models/free?prompt_type=long&page=3",
  ]);
});

test("rejects invalid V2 pagination metadata instead of returning a partial catalogue", async () => {
  await assert.rejects(
    collectAAPaginatedData(
      "/language/models/free",
      {
        data: [],
        pagination: {
          page: 0,
          page_size: 200,
          total_pages: 2,
          has_more: true,
        },
      },
      async () => ({ data: [] }),
    ),
    /invalid pagination metadata/,
  );
});

test("normalises the nested Artificial Analysis V2 language model schema", () => {
  const model = normaliseAAV2LanguageModel({
    id: "36f73aaf-d38a-4b56-a2b3-d04d17186910",
    name: "gpt-oss-20B (high)",
    slug: "gpt-oss-20b",
    release_date: "2025-08-05",
    model_creator: {
      id: "e67e56e3-15cd-43db-b679-da4660a69f41",
      name: "OpenAI",
    },
    reasoning_model: true,
    evaluations: {
      artificial_analysis_intelligence_index: 24.5,
      artificial_analysis_coding_index: 18.5,
      artificial_analysis_agentic_index: 27.6,
      gpqa_diamond: 0.69,
      aa_lcr: 0.31,
      aa_omniscience_accuracy: 0.16,
      aa_omniscience_index: -63.92,
      tau2_telecom: 0.6,
      artificial_analysis_multilingual_index: 0.8,
      unavailable_metric: null,
    },
    artificial_analysis_intelligence_index_cost: {
      total_cost: 20.69,
    },
    artificial_analysis_intelligence_index_token_counts: {
      output_tokens: 61_344_686,
    },
    pricing: {
      price_1m_blended_3_to_1: 0.09,
      price_1m_blended_7_to_2_to_1: 0.04,
      price_1m_input_tokens: 0.06,
      price_1m_output_tokens: 0.2,
      price_1m_cache_hit_tokens: 0.015,
      price_1m_cache_write_tokens: 0.075,
    },
    performance: {
      median_output_tokens_per_second: 296.47,
      median_time_to_first_token_seconds: 0.65,
      median_time_to_first_answer_token_seconds: 7.4,
      median_end_to_end_response_time_seconds: 9.09,
    },
    context_window_tokens: 131_072,
    parameters: { total: 21, active: 4 },
    modalities: {
      input: { text: true, image: false, video: false, speech: false },
      output: { text: true, image: false, video: false, speech: false },
    },
    licensing: { is_open_weights: true },
    huggingface_url: "https://huggingface.co/openai/gpt-oss-20b",
    openrouter_api_id: "openai/gpt-oss-20b",
  });

  assert.ok(model);
  assert.deepEqual(model.model_creator, {
    id: "e67e56e3-15cd-43db-b679-da4660a69f41",
    name: "OpenAI",
    slug: "openai",
  });
  assert.equal(model.evaluations.agentic_index, 27.6);
  assert.equal(model.evaluations.gpqa, 0.69);
  assert.equal(model.evaluations.lcr, 0.31);
  assert.equal(model.evaluations.omniscience, 0.16);
  assert.equal(model.evaluations.aa_omniscience_index, -63.92);
  assert.equal(model.evaluations.tau2, 0.6);
  assert.equal(model.evaluations.multilingual_aa, 0.8);
  assert.equal(model.evaluations.artificial_analysis_agentic_index, undefined);
  assert.equal(model.evaluations.unavailable_metric, null);
  assert.equal(model.pricing.price_1m_blended_7_2_1, 0.04);
  assert.equal(model.median_output_tokens_per_second, 296.47);
  assert.equal(model.median_time_to_first_answer_token, 7.4);
  assert.equal(model.end_to_end_response_time_seconds, 9.09);
  assert.equal(model.total_parameters_b, 21);
  assert.equal(model.active_parameters_b, 4);
  assert.equal(model.is_open_weights, true);
  assert.equal(model.intelligence_index_tokens, 61_344_686);
  assert.equal(model.intelligence_index_cost_usd, 20.69);
  assert.equal(model.openrouter_api_id, "openai/gpt-oss-20b");
});

test("keeps unavailable Free-tier fields missing and drops malformed rows", () => {
  const models = normaliseAAV2LanguageModels([
    {
      id: "free-model-id",
      name: "Free Model",
      slug: "free-model",
      model_creator: { id: "creator-id", name: "Z.AI" },
      evaluations: {},
      pricing: {},
      performance: {},
    },
    {
      id: "missing-slug",
      name: "Malformed",
      model_creator: { name: "Example" },
    },
  ]);

  assert.equal(models.length, 1);
  assert.equal(models[0].model_creator.slug, "zai");
  assert.equal(models[0].release_date, null);
  assert.equal(models[0].context_window_tokens, undefined);
  assert.equal(models[0].is_open_weights, undefined);
  assert.equal(models[0].median_output_tokens_per_second, null);
});
