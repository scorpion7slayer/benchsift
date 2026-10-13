import assert from "node:assert/strict";
import test from "node:test";
import { decisionIndexForModel, matchDecisionIndexModels } from "./decision-index-catalog.ts";

const model = (slug, creator = "openai", extra = {}) => ({
  id: slug,
  slug,
  name: slug,
  model_creator: { id: creator, name: creator.toUpperCase(), slug: creator },
  provider_icon_url: null,
  ...extra,
});

const row = (id) => ({ id, model_slug: id.slice(id.indexOf("_") + 1) });

test("Decision Index rows link by slug, alias, or the slug with dots read as dashes", () => {
  const models = [
    model("gpt-6-luna-high"),
    model("jev-1.13", "typesafe", { openrouter_api_id: "typesafe/jev-1.13", provider_icon_url: "/typesafe.svg" }),
    model("pplx-decider-v1.1-27b", "perplexity"),
    model("pplx-decider-v1-27b", "perplexity"),
    model("solar-decide-flash", "upstage", { alias_slugs: ["solar-decide"] }),
    model("liquid-d1", "liquid", { openrouter_api_id: "liquid/d1" }),
  ];
  const matches = matchDecisionIndexModels(models, [
    row("openai_gpt-6-luna-high"),
    row("typesafe_jev-1-13"),
    row("perplexity_pplx-decider-v1-1-27b"),
    row("upstage_solar-decide"),
    row("liquid-ai_d1"),
    row("fastino_glide"),
  ]);
  assert.equal(matches["openai_gpt-6-luna-high"].slug, "gpt-6-luna-high");
  assert.deepEqual(matches["typesafe_jev-1-13"], {
    slug: "jev-1.13",
    creatorSlug: "typesafe",
    creatorName: "TYPESAFE",
    iconUrl: "/typesafe.svg",
  });
  assert.equal(matches["perplexity_pplx-decider-v1-1-27b"].slug, "pplx-decider-v1.1-27b");
  assert.equal(matches["upstage_solar-decide"].slug, "solar-decide-flash");
  assert.equal(matches["liquid-ai_d1"].slug, "liquid-d1");
  assert.equal("fastino_glide" in matches, false);
});

test("Decision Index leaves a loose slug shared by two catalogue models unmatched", () => {
  const matches = matchDecisionIndexModels(
    [model("model-1.5"), model("model-1-5-preview", "openai", { openrouter_api_id: "openai/model-1.5" })],
    [row("openai_model-1-5")],
  );
  assert.deepEqual(matches, {});
});

test("Decision Index gives a model its best hosted result and global rank", () => {
  const rows = [
    { id: "anthropic_claude-opus-5-5", model_slug: "claude-opus-5-5", index: 79 },
    { id: "deepinfra_gemma-4-31b", model_slug: "gemma-4-31b", index: 55 },
    { id: "together_gemma-4-31b", model_slug: "gemma-4-31b", index: 54 },
  ];
  const models = [model("claude-opus-5-5", "anthropic"), model("gemma-4-31b", "google")];
  const matches = matchDecisionIndexModels(models, rows);
  assert.deepEqual(decisionIndexForModel(rows, matches, "gemma-4-31b"), { row: rows[1], rank: 2, total: 3 });
  assert.equal(decisionIndexForModel(rows, matches, "unknown"), null);
});
