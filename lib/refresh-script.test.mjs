import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "node:http";
import { once } from "node:events";

const refreshedAt = "2026-09-21T12:00:00.000Z";
async function runJob(respond, args = []) {
  const requests = [];
  const server = createServer((req, res) => {
    requests.push({ path: req.url, method: req.method, auth: req.headers.authorization });
    respond(req, res);
  }).listen(0, "127.0.0.1");
  await once(server, "listening");
  try {
    const child = Bun.spawn([process.execPath, new URL("../scripts/refresh-cache.mjs", import.meta.url).pathname, ...args], {
      env: { ...process.env, PORT: String(server.address().port), CRON_SECRET: "never-print-test-secret", REFRESH_CACHE_TIMEOUT_MS: "1500" },
      stdout: "pipe", stderr: "pipe",
    });
    const [stdout, stderr, code] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
    assert.doesNotMatch(stdout + stderr, /never-print-test-secret|private-cache-path|upstream-private-error/);
    return { stdout, stderr, code, requests };
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
}
function success(req, res, status = {}) {
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(req.url.endsWith("refresh")
    ? { ok: true, count: 42, durationMs: 63000, stats: { apiModels: 30, transientRetries: 2 } }
    : { ok: true, exists: true, valid: true, fresh: true, count: 42, refreshedAt, cacheFile: "private-cache-path", ...status }));
}

test("refresh job produces readable progress and verifies the authenticated persisted cache", async () => {
  const result = await runJob(success);
  assert.equal(result.code, 0);
  assert.match(result.stdout, /42 models in 63s/);
  assert.match(result.stdout, /Artificial Analysis \(language\): 30/);
  assert.match(result.stdout, /Upstream retries: 2/);
  assert.match(result.stdout, /SUCCESS: cache verified/);
  assert.deepEqual(result.requests.map(r => [r.path, r.method]), [["/api/cron/refresh", "POST"], ["/api/cron/status", "GET"]]);
  assert.ok(result.requests.every(r => r.auth === "Bearer never-print-test-secret"));
});
test("optional JSON is a single sanitized summary", async () => {
  const result = await runJob(success, ["--json"]);
  assert.equal(result.code, 0);
  const data = JSON.parse(result.stdout);
  assert.equal(data.ok, true);
  assert.deepEqual(data.cache, { valid: true, fresh: true, count: 42, refreshedAt });
});
test("refresh job fails for stale, mismatched or invalid cache verification", async () => {
  for (const status of [{ fresh: false }, { valid: false }, { count: 41 }]) {
    const result = await runJob((req, res) => success(req, res, status));
    assert.equal(result.code, 1);
    assert.match(result.stderr, /Cache verification failed/);
    assert.doesNotMatch(result.stdout, /SUCCESS/);
  }
});
test("refresh errors and malformed payloads fail without leaking response bodies", async () => {
  for (const payload of ["not JSON", JSON.stringify({ ok: false, error: "upstream-private-error" }), JSON.stringify({ ok: true, count: 0 })]) {
    const result = await runJob((_req, res) => res.end(payload));
    assert.equal(result.code, 1);
    assert.equal(result.requests.length, 1);
    assert.match(result.stderr, /FAILED/);
  }
  const result = await runJob((_req, res) => { res.statusCode = 503; res.end("upstream-private-error"); });
  assert.equal(result.code, 1);
  assert.match(result.stderr, /HTTP 503/);
});
test("refresh deadline bounds an unresponsive local application", async () => {
  const result = await runJob(() => {});
  assert.equal(result.code, 1);
  assert.match(result.stderr, /timed out/);
});
