import assert from "node:assert/strict";
import test from "node:test";

const { errorKind, isErrorKind } = await import("./error-kind.ts");

test("maps explicit HTTP statuses to their page", () => {
  assert.equal(errorKind({ status: 429 }), "rateLimited");
  assert.equal(errorKind({ statusCode: 403 }), "forbidden");
  assert.equal(errorKind({ response: { status: 503 } }), "unavailable");
  assert.equal(errorKind({ status: 404 }), "notFound");
  assert.equal(errorKind({ status: 500 }), "server");
  assert.equal(errorKind(new Error("Request failed with status code 502")), "unavailable");
  assert.equal(errorKind(new Error("HTTP 429")), "rateLimited");
  assert.equal(errorKind(new Error("503 Service Unavailable")), "unavailable");
});

test("ignores numbers that are not a status", () => {
  assert.equal(errorKind(new Error("Expected 429 models, got 12")), "server");
  assert.equal(errorKind(new Error("Cannot read properties of undefined")), "server");
  assert.equal(errorKind(undefined), "server");
});

test("treats lost connections and stale chunks as network errors", () => {
  assert.equal(errorKind(new TypeError("Failed to fetch")), "network");
  assert.equal(errorKind(new TypeError("Load failed")), "network");
  assert.equal(errorKind(new TypeError("Failed to fetch dynamically imported module: /assets/x.js")), "network");
  assert.equal(errorKind(new Error("boom"), { online: false }), "network");
});

test("validates preview kinds", () => {
  assert.equal(isErrorKind("unavailable"), true);
  assert.equal(isErrorKind("teapot"), false);
});
