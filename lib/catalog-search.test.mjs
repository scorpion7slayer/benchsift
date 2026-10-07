import assert from "node:assert/strict";
import test from "node:test";

import {
  catalogStateFromSearch,
  parseCatalogSearch,
  sameCatalogSearch,
  searchFromCatalogState,
} from "./catalog-search.ts";

test("catalogue search keeps only known values and omits defaults", () => {
  assert.deepEqual(
    parseCatalogSearch({ q: "  claude ", view: "advanced", sort: "speed", rank: "nope", weights: "open", type: "decisions", provider: "openai" }),
    { q: "claude", view: "advanced", sort: "speed", weights: "open", type: "decisions", provider: "openai" },
  );
  assert.deepEqual(parseCatalogSearch({ view: "normal", sort: "intelligence", weights: "all", provider: "<script>" }), {});
  assert.equal(parseCatalogSearch({ q: "x".repeat(200) }).q.length, 80);
});

test("catalogue state round-trips through the URL without mode leakage", () => {
  const advanced = catalogStateFromSearch({ view: "advanced", sort: "price", type: "image", provider: "google" });
  assert.equal(advanced.viewMode, "advanced");
  assert.equal(advanced.ranking, "intelligence");
  assert.equal(advanced.direction, "asc");
  assert.deepEqual(searchFromCatalogState(advanced), { view: "advanced", sort: "price", type: "image", provider: "google" });
  assert.deepEqual(
    searchFromCatalogState({ ...advanced, direction: "desc" }),
    { view: "advanced", sort: "price", dir: "desc", type: "image", provider: "google" },
  );
  const normal = { ...advanced, viewMode: "normal", ranking: "speed" };
  assert.deepEqual(searchFromCatalogState(normal), { rank: "speed", provider: "google" });
  assert.equal(sameCatalogSearch({ q: "a" }, { q: "a" }), true);
  assert.equal(sameCatalogSearch({ q: "a" }, {}), false);
});

test("catalogue sort direction is written only when it differs from the default", () => {
  assert.deepEqual(parseCatalogSearch({ view: "advanced", sort: "speed", dir: "desc" }), { view: "advanced", sort: "speed" });
  assert.deepEqual(parseCatalogSearch({ view: "advanced", sort: "speed", dir: "asc" }), { view: "advanced", sort: "speed", dir: "asc" });
  assert.deepEqual(parseCatalogSearch({ view: "advanced", dir: "asc" }), { view: "advanced", dir: "asc" });
  assert.deepEqual(parseCatalogSearch({ dir: "sideways" }), {});
  assert.equal(catalogStateFromSearch({ sort: "newest" }).direction, "desc");
});

test("former price sorts keep working in shared links", () => {
  assert.deepEqual(parseCatalogSearch({ view: "advanced", sort: "price_asc" }), { view: "advanced", sort: "price" });
  assert.deepEqual(parseCatalogSearch({ view: "advanced", sort: "price_desc" }), { view: "advanced", sort: "price", dir: "desc" });
});

test("catalogue thresholds accept only preset values and stay in Advanced mode", () => {
  assert.deepEqual(
    parseCatalogSearch({ view: "advanced", min: "40", price: "1", ctx: "128000", speed: "7", reasoning: "yes" }),
    { view: "advanced", min: 40, price: 1, ctx: 128000, reasoning: "yes" },
  );
  const state = catalogStateFromSearch({ view: "advanced", min: 40, reasoning: "no" });
  assert.equal(state.minScore, 40);
  assert.equal(state.reasoning, "no");
  assert.deepEqual(searchFromCatalogState(state), { view: "advanced", min: 40, reasoning: "no" });
  assert.deepEqual(searchFromCatalogState({ ...state, viewMode: "normal" }), {});
});
