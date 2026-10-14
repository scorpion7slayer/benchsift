import assert from "node:assert/strict";
import test from "node:test";

import {
  getCanonicalCreatorSlug,
  getCreatorDisplayName,
  getModelLogoKey,
  getModelProviderKey,
  getProviderKey,
  resolveCreatorFromModelSlug,
} from "./provider-map.ts";

test("normalizes creator aliases and provider display names", () => {
  assert.equal(getCanonicalCreatorSlug("Z-AI"), "zai");
  assert.equal(getCanonicalCreatorSlug("ZHIPU"), "zai");
  assert.equal(getCanonicalCreatorSlug("LG-AI-RESEARCH"), "lg");
  assert.equal(getCanonicalCreatorSlug("VoyageAI"), "voyage");
  assert.equal(getProviderKey("Amazon"), "aws");
  assert.equal(getProviderKey("voyage-ai"), "voyage");
  assert.equal(getProviderKey("Unknown-Lab"), "unknown-lab");
  assert.equal(getCreatorDisplayName("z-ai", "Zhipu AI"), "Z.AI");
  assert.equal(getCreatorDisplayName("voyageai", "Voyageai"), "Voyage AI");
  assert.equal(getCreatorDisplayName("unknown-lab", "Unknown Lab"), "Unknown Lab");
});

test("applies product-brand overrides only for their real creators", () => {
  const cases = [
    ["qwen3-235b", "alibaba", "qwen"],
    ["qwen3-8-max", "alibaba", "qwen"],
    ["qwen3.8-max", "qwen", "qwen"],
    ["qwq-32b", "qwen", "qwen"],
    ["qvq-max", "alibaba", "qwen"],
    ["wan2.5", "alibaba", "alibaba"],
    ["kimi-k2", "moonshotai", "kimi"],
    ["longcat-flash", "meituan", "longcat"],
    ["qwen3-235b", "nvidia", "nvidia"],
    ["kimi-k2", "friendliai", "friendliai"],
    ["longcat-flash", "google", "google"],
  ];

  for (const [modelSlug, creatorSlug, expected] of cases) {
    assert.equal(getModelProviderKey(modelSlug, creatorSlug), expected);
  }
});

test("resolves known model families and preserves the lowercase fallback", () => {
  const cases = [
    ["glm-5-1", "friendliai", "zai"],
    ["composer-2", "friendliai", "cursor"],
    ["claude-opus-4", "bedrock", "anthropic"],
    ["gpt-5", "openrouter", "openai"],
    ["o1-mini", "openrouter", "openai"],
    ["o3-mini", "openrouter", "openai"],
    ["o4-mini", "openrouter", "openai"],
    ["gemini-2.5-pro", "vertex", "google"],
    ["kimi-k2", "friendliai", "moonshot"],
    ["deepseek-v3", "together", "deepseek"],
    ["qwen3-235b", "alibaba", "qwen"],
    ["qwq-32b", "alibaba", "qwen"],
    ["qvq-max", "alibaba", "qwen"],
    ["llama-4", "groq", "meta"],
    ["mistral-large", "azure", "mistral"],
    ["mixtral-8x22b", "groq", "mistral"],
    ["codestral-latest", "mistral", "mistral"],
    ["grok-4", "xai", "xai"],
    ["mimo-v2", "xiaomi", "xiaomi"],
    ["custom-model", "SomeHost", "somehost"],
  ];

  for (const [modelSlug, hostFallback, expected] of cases) {
    assert.equal(resolveCreatorFromModelSlug(modelSlug, hostFallback), expected);
  }
});

test("normalizes source-specific lab namespaces without treating unrelated hosts as creators", () => {
  for (const [alias, canonical] of [["meta-llama", "meta"], ["arcee-ai", "arcee"], ["moonshot", "moonshotai"], ["swiss-ai", "swiss-ai-initiative"], ["bytedance_seed", "bytedance"], ["zhipuai", "zai"]]) {
    assert.equal(getCanonicalCreatorSlug(alias), canonical);
  }
  assert.equal(getCanonicalCreatorSlug("azure"), "azure");
  assert.equal(getCanonicalCreatorSlug("friendliai"), "friendliai");
});

test("uses a model family mark only when the creator owns the family brand", () => {
  const cases = [
    ["qwen3-235b", "alibaba", "family:qwen"],
    ["qwen_qwen3-vl", "alibaba", "family:qwen"],
    ["qwen3.8-max", "qwen", "family:qwen"],
    ["wan2.5", "alibaba", "alibaba"],
    ["gemini-3-pro", "google", "family:gemini"],
    ["google_gemini-2-5-flash", "google", "family:gemini"],
    ["diffusiongemma-26b-a4b", "google", "family:gemma"],
    ["veo-3", "google", "google"],
    ["claude-opus-5-5", "anthropic", "family:claude"],
    ["grok-4-7", "spacexai", "family:grok"],
    ["hy3", "tencent", "family:hunyuan"],
    ["tencent_hunyuanimage-3-0-fal", "tencent", "family:hunyuan"],
    ["flux_srpo", "tencent", "tencent"],
    ["ernie-5", "baidu", "family:ernie"],
    ["nova-pro-v1", "amazon", "family:nova"],
    ["nova-2-lite", "aws", "family:nova"],
    ["mimo-v2", "xiaomi", "family:mimo"],
    ["hailuo-02-pro", "minimax", "family:hailuo"],
    ["minimax-m3", "minimax", "minimax"],
    ["sora-2", "openai", "family:sora"],
    ["gpt-6", "openai", "openai"],
    ["kimi-k2", "moonshotai", "kimi"],
    // A family hosted or fine-tuned by another company keeps that company's logo.
    ["qwen3-235b", "nvidia", "nvidia"],
    ["gemma-3-27b", "nvidia", "nvidia"],
    ["claude-opus-4", "bedrock", "bedrock"],
  ];

  for (const [modelSlug, creatorSlug, expected] of cases) {
    assert.equal(getModelLogoKey(modelSlug, creatorSlug), expected, `${modelSlug} by ${creatorSlug}`);
  }
});
