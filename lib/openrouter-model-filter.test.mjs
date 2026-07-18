import assert from "node:assert/strict";
import test from "node:test";

import {
  filterOpenRouterCatalogEntries,
  isExcludedOpenRouterCatalogEntry,
  isExcludedOpenRouterModelId,
  isOpenRouterFreeVariantId,
  isOpenRouterNonModelId,
} from "./openrouter-model-filter.ts";

test("excludes OpenRouter-owned routers and services, including new IDs", () => {
  for (const id of [
    "openrouter/auto",
    "openrouter/auto-beta",
    "openrouter/bodybuilder",
    "openrouter/free",
    "openrouter/fusion",
    "openrouter/pareto-code",
    "openrouter:openrouter/auto-beta",
    " OpenRouter:OpenRouter/Future-Router ",
  ]) {
    assert.equal(isOpenRouterNonModelId(id), true, id);
    assert.equal(isExcludedOpenRouterModelId(id), true, id);
  }
});

test("filters a mixed OpenRouter API response without removing paid models", () => {
  const retained = filterOpenRouterCatalogEntries([
    { id: "openrouter/auto-beta", architecture: { tokenizer: "Router" } },
    { id: "nvidia/nemotron-3-embed-1b:free" },
    { id: "~openai/gpt-latest", architecture: { tokenizer: "Router" } },
    { id: "openai/gpt-oss-20b" },
    { id: "qwen/qwen3-coder" },
  ]);

  assert.deepEqual(
    retained.map((model) => model.id),
    ["openai/gpt-oss-20b", "qwen/qwen3-coder"],
  );
});

test("excludes router aliases identified by OpenRouter metadata", () => {
  assert.equal(
    isExcludedOpenRouterCatalogEntry({
      id: "~anthropic/claude-sonnet-latest",
      architecture: { tokenizer: "Router" },
    }),
    true,
  );
  assert.equal(
    isExcludedOpenRouterCatalogEntry({
      id: "anthropic/claude-sonnet-4.6",
      architecture: { tokenizer: "Claude" },
    }),
    false,
  );
});

test("excludes raw and cached OpenRouter free variants", () => {
  for (const id of [
    "nvidia/nemotron-3-embed-1b:free",
    "openrouter:nvidia/nemotron-3-embed-1b:free",
    "OPENROUTER:QWEN/QWEN3-CODER:FREE",
  ]) {
    assert.equal(isOpenRouterFreeVariantId(id), true, id);
    assert.equal(isExcludedOpenRouterModelId(id), true, id);
  }
});

test("retains ordinary paid model IDs", () => {
  for (const id of [
    "openai/gpt-oss-20b",
    "qwen/qwen3-coder",
    "openrouter:openai/gpt-oss-20b",
    "openrouter:qwen/qwen3-coder",
    "vendor/freedom",
    "vendor/model:free-preview",
  ]) {
    assert.equal(isOpenRouterNonModelId(id), false, id);
    assert.equal(isOpenRouterFreeVariantId(id), false, id);
    assert.equal(isExcludedOpenRouterModelId(id), false, id);
  }
});
