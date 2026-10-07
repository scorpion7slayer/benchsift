import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";

import { createServer } from "vite";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
let server;
let catalog;

before(async () => {
  server = await createServer({
    configFile: false,
    root: projectRoot,
    logLevel: "silent",
    resolve: { alias: { "@": projectRoot } },
    server: { middlewareMode: true },
  });
  catalog = await server.ssrLoadModule("/lib/deepswe-catalog.ts");
});

after(async () => {
  await server?.close();
});

function model(slug, name, creator = "openai") {
  return { id: slug, slug, name, model_creator: { id: creator, name: creator, slug: creator }, provider_icon_url: null };
}

test("links DeepSWE configurations to the matching catalogue reasoning level", () => {
  const models = [
    model("gpt-5-6-sol", "GPT-5.6 Sol (max)"),
    model("gpt-5-6-sol-medium", "GPT-5.6 Sol (medium)"),
    model("claude-opus-4-8", "Claude Opus 4.8 (Adaptive Reasoning, Max Effort)", "anthropic"),
  ];
  const matches = catalog.matchDeepSweModels(models, [
    { model: "gpt-5-6-sol", reasoning_effort: "medium" },
    { model: "gpt-5-6-sol", reasoning_effort: "max" },
    { model: "claude-opus-4-8", reasoning_effort: "max" },
    { model: "unknown-model", reasoning_effort: "high" },
  ]);
  assert.deepEqual(matches[catalog.deepSweCatalogKey("gpt-5-6-sol", "medium")], {
    slug: "gpt-5-6-sol-medium",
    name: "GPT-5.6 Sol",
    creatorSlug: "openai",
    creatorName: "openai",
    iconUrl: null,
  });
  assert.equal(matches[catalog.deepSweCatalogKey("gpt-5-6-sol", "max")].slug, "gpt-5-6-sol");
  assert.equal(matches[catalog.deepSweCatalogKey("claude-opus-4-8", "max")].name, "Claude Opus 4.8");
  assert.equal(matches[catalog.deepSweCatalogKey("unknown-model", "high")], undefined);
});
