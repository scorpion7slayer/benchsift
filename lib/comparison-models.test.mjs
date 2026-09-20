import assert from "node:assert/strict";
import test from "node:test";
import { enrichComparisonModel } from "./comparison-models.ts";
test("late comparison details fill gaps without erasing zero, false, source measurements or identity", () => {
  const model = {
    id: "original",
    slug: "one",
    name: "One",
    model_creator: { slug: "lab" },
    reasoning_model: false,
    context_window_tokens: null,
    evaluations: { gpqa: 0, hle: null },
    pricing: { price_1m_input_tokens: 0 },
  };
  const result = enrichComparisonModel(model, {
    slug: "different",
    reasoning_model: true,
    context_window_tokens: 64000,
    evaluations: { gpqa: 0.9, hle: 0.2 },
    pricing: { price_1m_input_tokens: 5, price_1m_output_tokens: 2 },
  });
  assert.equal(result.slug, "one");
  assert.equal(result.reasoning_model, false);
  assert.equal(result.context_window_tokens, 64000);
  assert.deepEqual(result.evaluations, { gpqa: 0, hle: 0.2 });
  assert.deepEqual(result.pricing, {
    price_1m_input_tokens: 0,
    price_1m_output_tokens: 2,
  });
  assert.equal(model.evaluations.hle, null);
});
