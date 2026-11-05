import assert from "node:assert/strict";
import test from "node:test";

import {
  FRESH_MS,
  PARTIAL_FRESH_MS,
  RENDER_BUDGET_MS,
  STALE_MS,
  cacheState,
  dropLocalHtmlCache,
  expireHtmlCache,
  htmlCacheKey,
  isStorableResponse,
  serveWithHtmlCache,
  setSharedHtmlStore,
  withinRenderBudget,
} from "./html-cache.ts";

const origin = "https://benchsift.nxtaigen.com";
const get = (path, headers = {}) => new Request(origin + path, { headers });
const html = (body, init = {}) =>
  new Response(body, { status: 200, ...init, headers: { "content-type": "text/html; charset=utf-8", ...init.headers } });

test("shares only anonymous, query-free model page requests", () => {
  assert.equal(htmlCacheKey(get("/models/claude-opus-5-5")), "/models/claude-opus-5-5");
  assert.equal(htmlCacheKey(get("/fr/models/gpt-6-1-terra")), "/fr/models/gpt-6-1-terra");
  assert.equal(htmlCacheKey(get("/models/claude-opus-5-5", { cookie: "benchsift_theme=dark" })), null);
  assert.equal(htmlCacheKey(get("/models/claude-opus-5-5?x=1")), null);
  assert.equal(htmlCacheKey(get("/models")), null);
  assert.equal(htmlCacheKey(get("/models/page/2")), null);
  assert.equal(htmlCacheKey(get("/")), null);
  assert.equal(htmlCacheKey(new Request(origin + "/models/a-b", { method: "POST" })), null);
});

test("stores only plain successful HTML responses", () => {
  assert.equal(isStorableResponse(html("ok")), true);
  assert.equal(isStorableResponse(html("missing", { status: 404 })), false);
  assert.equal(isStorableResponse(new Response("{}", { headers: { "content-type": "application/json" } })), false);
  assert.equal(isStorableResponse(html("ok", { headers: { "set-cookie": "a=1" } })), false);
});

test("a stored page is fresh, then stale, then expired", () => {
  const entry = { status: 200, headers: [], body: "", storedAt: 0, freshUntil: FRESH_MS };
  assert.equal(cacheState(entry, FRESH_MS - 1), "fresh");
  assert.equal(cacheState(entry, FRESH_MS), "stale");
  assert.equal(cacheState(entry, STALE_MS), "expired");
});

test("serves the second anonymous visit from the cache", async () => {
  let renders = 0;
  const render = async () => { renders++; return html(`<p>${renders}</p>`); };
  const first = await serveWithHtmlCache(get("/models/cache-hit"), render);
  const second = await serveWithHtmlCache(get("/models/cache-hit"), render);
  assert.equal(first.headers.get("x-benchsift-cache"), "MISS");
  assert.equal(second.headers.get("x-benchsift-cache"), "HIT");
  assert.equal(await second.text(), "<p>1</p>");
  assert.equal(renders, 1);
});

test("visitors with cookies are always rendered for themselves", async () => {
  let renders = 0;
  const render = async () => { renders++; return html("x"); };
  await serveWithHtmlCache(get("/models/with-cookie", { cookie: "a=1" }), render);
  const second = await serveWithHtmlCache(get("/models/with-cookie", { cookie: "a=1" }), render);
  assert.equal(renders, 2);
  assert.equal(second.headers.get("x-benchsift-cache"), null);
});

test("an expired catalogue serves the old page once while it renders again", async () => {
  let renders = 0;
  const render = async () => { renders++; return html(`v${renders}`); };
  await serveWithHtmlCache(get("/models/expire-me"), render);
  await expireHtmlCache();
  const stale = await serveWithHtmlCache(get("/models/expire-me"), render);
  assert.equal(stale.headers.get("x-benchsift-cache"), "STALE");
  assert.equal(await stale.text(), "v1");
  await new Promise((resolve) => setTimeout(resolve, 10));
  const fresh = await serveWithHtmlCache(get("/models/expire-me"), render);
  assert.equal(await fresh.text(), "v2");
  assert.equal(fresh.headers.get("x-benchsift-cache"), "HIT");
});

test("slow streamed data is left out of a cached render, which is retried soon", async () => {
  const slow = new Promise((resolve) => setTimeout(() => resolve("late"), RENDER_BUDGET_MS + 200));
  const started = Date.now();
  let value;
  const response = await serveWithHtmlCache(get("/models/slow-scrape"), async () => {
    value = await withinRenderBudget(slow, "fallback");
    return html(value);
  });
  assert.equal(value, "fallback");
  assert.ok(Date.now() - started < RENDER_BUDGET_MS + 150);
  assert.equal(response.headers.get("x-benchsift-cache"), "MISS");
  assert.ok(PARTIAL_FRESH_MS < FRESH_MS);
  // Outside a cached render the promise is returned untouched.
  assert.equal(await withinRenderBudget(Promise.resolve("direct"), "fallback"), "direct");
});

test("a render stored in Redis survives a restart and a refresh marks it stale", async () => {
  const redis = new Map();
  setSharedHtmlStore({
    async get(keys) { return keys.map((key) => redis.get(key) ?? null); },
    async set(key, value) { redis.set(key, value); },
  });
  try {
    let renders = 0;
    const render = async () => { renders++; return html(`<main>shared ${renders}</main>`); };
    await serveWithHtmlCache(get("/fr/models/shared-page"), render);
    await new Promise((resolve) => setTimeout(resolve, 5));
    const stored = redis.get("benchsift:html:v1:/fr/models/shared-page");
    assert.ok(stored && !stored.includes("<main>"), "the body is stored compressed");

    dropLocalHtmlCache();
    const afterRestart = await serveWithHtmlCache(get("/fr/models/shared-page"), render);
    assert.equal(afterRestart.headers.get("x-benchsift-cache"), "HIT");
    assert.equal(await afterRestart.text(), "<main>shared 1</main>");
    assert.equal(renders, 1);

    await new Promise((resolve) => setTimeout(resolve, 5));
    await expireHtmlCache();
    dropLocalHtmlCache();
    const afterRefresh = await serveWithHtmlCache(get("/fr/models/shared-page"), render);
    assert.equal(afterRefresh.headers.get("x-benchsift-cache"), "STALE");
  } finally {
    setSharedHtmlStore({ async get() { return null; }, async set() {} });
  }
});

test("an unavailable shared store falls back to rendering", async () => {
  setSharedHtmlStore({
    async get() { throw new Error("down"); },
    async set() { throw new Error("down"); },
  });
  try {
    const response = await serveWithHtmlCache(get("/models/redis-down"), async () => html("ok"));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("x-benchsift-cache"), "MISS");
  } finally {
    setSharedHtmlStore({ async get() { return null; }, async set() {} });
  }
});
