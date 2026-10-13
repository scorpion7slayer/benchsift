import assert from "node:assert/strict";
import test from "node:test";
import { matchFrontierCodeModels } from "./frontiercode-catalog.ts";

const model = (slug, creator = "anthropic", extra = {}) => ({
  id: slug,
  slug,
  name: slug,
  model_creator: { id: creator, name: creator.toUpperCase(), slug: creator },
  provider_icon_url: null,
  ...extra,
});

test("FrontierCode rows link to the catalogue by exact slug or alias, and unknown slugs stay unmatched", () => {
  const models = [
    model("claude-opus-5-5"),
    model("kimi-k3", "moonshotai", { alias_slugs: ["kimi-k3-max"], provider_icon_url: "/kimi.svg" }),
  ];
  const matches = matchFrontierCodeModels(models, [
    { slug: "claude-opus-5-5" },
    { slug: "kimi-k3-max" },
    { slug: "not-in-catalogue" },
  ]);
  assert.deepEqual(matches["claude-opus-5-5"], {
    slug: "claude-opus-5-5",
    creatorSlug: "anthropic",
    creatorName: "ANTHROPIC",
    iconUrl: null,
  });
  assert.equal(matches["kimi-k3-max"].slug, "kimi-k3");
  assert.equal(matches["kimi-k3-max"].iconUrl, "/kimi.svg");
  assert.equal("not-in-catalogue" in matches, false);
});
