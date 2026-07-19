import assert from "node:assert/strict";
import test from "node:test";

import {
  extractAACapabilities,
  extractAAPartialModelData,
  extractJsonNumber,
  extractJsonString,
} from "./aa-capabilities.ts";

test("extracts primitives from regular and escaped JSON-like HTML", () => {
  assert.equal(extractJsonNumber('"score" : 42.5', "score"), 42.5);
  assert.equal(
    extractJsonNumber(String.raw`{\"score\":17.25}`, "score"),
    17.25,
  );
  assert.equal(extractJsonString('"name":"Luna"', "name"), "Luna");
  assert.equal(
    extractJsonString(String.raw`{\"name\":\"Terra\"}`, "name"),
    "Terra",
  );
  assert.equal(extractJsonNumber('"score":"not-a-number"', "score"), null);
  assert.equal(extractJsonNumber('"score":null "score":64', "score"), 64);
  assert.equal(extractJsonString('"name":null "name":"Sol"', "name"), "Sol");
});

test("parses structured Artificial Analysis capability fields", () => {
  const html = [
    '"context_window_tokens": 128000',
    '"totalParameters":null',
    String.raw`\"totalParameters\":\"1.5T\"`,
    '"activeParameters":"750M"',
    '"reasoning_model":null "reasoning_model":true',
    String.raw`\"isOpenWeights\":false`,
    '"inputModalityText":true',
    '"output_modality_text":true',
    '"knowledge_cutoff_date":"2025-01-31"',
    '"openness":{"opennessIndex":42.5}',
    '"intelligence_index_token_counts":{"output_tokens":76000000}',
    '"intelligence_index_cost":{"total_cost":910.37}',
    '"end_to_end_response_time_metrics":{"total_time":3.25}',
  ].join(" ");

  assert.deepEqual(extractAACapabilities(html), {
    context_window_tokens: 128000,
    total_parameters_b: 1500,
    active_parameters_b: 0.75,
    reasoning_model: true,
    reasoning_properties: null,
    is_open_weights: false,
    input_modality_text: true,
    input_modality_image: undefined,
    input_modality_speech: undefined,
    input_modality_video: undefined,
    output_modality_text: true,
    output_modality_image: undefined,
    output_modality_speech: undefined,
    output_modality_video: undefined,
    knowledge_cutoff: "2025-01-31",
    openness_index: 42.5,
    intelligence_index_tokens: 76000000,
    intelligence_index_cost_usd: 910.37,
    end_to_end_response_time_seconds: 3.25,
  });
});

test("keeps text fallbacks and unit conversions", () => {
  const html = [
    "This model has a context window of 1.5M tokens.",
    "Total parameters are roughly 7 B.",
    "Active parameters are roughly 350 M.",
    "Knowledge cutoff July 2024.",
    "When evaluating the Intelligence Index, it generated 76M tokens.",
    "It cost $1,234.50 to evaluate.",
    '"median_end_to_end_response_time_seconds":2.75',
  ].join(" ");
  const capabilities = extractAACapabilities(html);

  assert.equal(capabilities.context_window_tokens, 1_500_000);
  assert.equal(capabilities.total_parameters_b, 7);
  assert.equal(capabilities.active_parameters_b, 0.35);
  assert.equal(capabilities.knowledge_cutoff, "July 2024");
  assert.equal(capabilities.intelligence_index_tokens, 76_000_000);
  assert.equal(capabilities.intelligence_index_cost_usd, 1_234.5);
  assert.equal(capabilities.end_to_end_response_time_seconds, 2.75);
});

test("builds the base partial-model data from one HTML payload", () => {
  const html = [
    '"model_creator_slug":"openai"',
    '"model_creator_name":"OpenAI"',
    '"model_name":"GPT Test 20b"',
    '"release_date":"2026-07-01"',
    '"price_1m_blended_3_to_1":1.25',
    '"price_1m_input_tokens":0.5',
    '"price_1m_output_tokens":3.5',
    '"intelligence_index":48.2',
    '"coding_index":51.1',
    '"median_output_tokens_per_second":125',
  ].join(" ");
  const model = extractAAPartialModelData(html, "gpt-test-20b");

  assert.equal(model.name, "GPT Test 20b");
  assert.equal(model.release_date, "2026-07-01");
  assert.deepEqual(model.model_creator, {
    id: "openai",
    name: "OpenAI",
    slug: "openai",
  });
  assert.equal(model.pricing.price_1m_blended_3_to_1, 1.25);
  assert.equal(model.evaluations.artificial_analysis_intelligence_index, 48.2);
  assert.equal(model.evaluations.artificial_analysis_coding_index, 51.1);
  assert.equal(model.median_output_tokens_per_second, 125);

  const fallback = extractAAPartialModelData("", "nvidia-nemotron-3-nano-30b");
  assert.equal(fallback.name, "Nvidia Nemotron 3 Nano 30B");
  assert.equal(fallback.model_creator.name, "Nvidia");
});

test("reads the current creator name from AA metadata when JSON fields are absent", () => {
  const html = [
    '<meta name="description" content="Analysis of Anthropic&#x27;s Claude Fable 5',
    'and comparison to other AI models.">',
    '<title>Claude Fable 5 (with fallback) - Intelligence &amp; Price Analysis</title>',
  ].join(" ");
  const model = extractAAPartialModelData(html, "claude-fable-5");

  assert.equal(model.name, "Claude Fable 5 (with fallback)");
  assert.deepEqual(model.model_creator, {
    id: "anthropic",
    name: "Anthropic",
    slug: "anthropic",
  });
});
