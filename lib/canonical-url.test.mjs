import assert from "node:assert/strict";
import test from "node:test";

import { canonicalPath, canonicalRedirect } from "./canonical-url.ts";

test("canonical paths leave clean addresses alone", () => {
  for (const path of ["/", "/compare", "/models", "/models/page/2", "/models/gpt-6-astra", "/models/QwQ-32B-Preview", "/benchmarks/robotics", "/robots.txt", "/.well-known/api-catalog", "/docs/api"]) {
    assert.equal(canonicalPath(path), null, path);
  }
});

test("canonical paths fold the usual URL variants into one", () => {
  const cases = {
    "/compare/": "/compare",
    "/Compare": "/compare",
    "/COMPARE/": "/compare",
    "//models//gpt-6-astra/": "/models/gpt-6-astra",
    "/Models/QwQ-32B-Preview/": "/models/QwQ-32B-Preview",
    "/models/Page/2": "/models/page/2",
    "/index.html": "/",
    "/index": "/",
    "/about.html": "/about",
    "/about/index.html": "/about",
    "/robots.txt/": "/robots.txt",
    "/models/page/1": "/models",
    "/models/page/01/": "/models",
    "/models/page/02": "/models/page/2",
    "/agents": "/agents/coding",
    "/docs/": "/docs/api",
  };
  for (const [from, to] of Object.entries(cases)) assert.equal(canonicalPath(from), to, from);
  // One redirect reaches the final address.
  for (const to of Object.values(cases)) assert.equal(canonicalPath(to), null, to);
});

test("canonical paths never touch hashed assets or server functions", () => {
  for (const path of ["/assets/Index-AbC.js", "/_serverFn/AbC/", "/logos/OpenAI.svg", "/fonts/X.woff2"]) {
    assert.equal(canonicalPath(path), null, path);
  }
  // A page number that is not a page stays as it is, for the route to reject.
  assert.equal(canonicalPath("/models/page/0"), null);
});

test("canonical redirects are permanent, relative and keep the query", () => {
  const response = canonicalRedirect(new Request("http://internal:3000/Benchmarks/Robotics/?task=pour-drink-into-cup&model=claude-opus-5-5"));
  assert.equal(response.status, 308);
  assert.equal(response.headers.get("location"), "/benchmarks/robotics?task=pour-drink-into-cup&model=claude-opus-5-5");
  assert.equal(canonicalRedirect(new Request("http://internal:3000/compare")), null);
  assert.equal(canonicalRedirect(new Request("http://internal:3000/Compare/", { method: "POST" })), null);
});
