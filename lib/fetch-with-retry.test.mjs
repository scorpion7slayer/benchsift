import assert from "node:assert/strict";
import test from "node:test";

import { fetchWithRetry } from "./fetch-with-retry.ts";

test("retries transient GET responses and then returns the success", async () => {
  let calls = 0;
  const delays = [];
  const response = await fetchWithRetry(
    "https://example.com/models",
    {},
    {
      fetchImpl: async () => {
        calls += 1;
        return calls === 1
          ? new Response("temporary", { status: 503 })
          : Response.json({ ok: true });
      },
      sleep: async (delayMs) => {
        delays.push(delayMs);
      },
      random: () => 0.5,
      baseDelayMs: 100,
    },
  );

  assert.equal(response.status, 200);
  assert.equal(calls, 2);
  assert.deepEqual(delays, [100]);
});

test("honors Retry-After while keeping the delay bounded", async () => {
  const delays = [];
  let calls = 0;
  await fetchWithRetry(
    "https://example.com/models",
    {},
    {
      fetchImpl: async () => {
        calls += 1;
        return calls === 1
          ? new Response(null, {
              status: 429,
              headers: { "retry-after": "9" },
            })
          : new Response(null, { status: 204 });
      },
      sleep: async (delayMs) => {
        delays.push(delayMs);
      },
      maxDelayMs: 2_000,
    },
  );

  assert.deepEqual(delays, [2_000]);
});

test("does not retry permanent responses or non-idempotent methods", async () => {
  let getCalls = 0;
  const notFound = await fetchWithRetry(
    "https://example.com/missing",
    {},
    {
      fetchImpl: async () => {
        getCalls += 1;
        return new Response(null, { status: 404 });
      },
      sleep: async () => {},
    },
  );

  let postCalls = 0;
  const unavailable = await fetchWithRetry(
    "https://example.com/refresh",
    { method: "POST" },
    {
      fetchImpl: async () => {
        postCalls += 1;
        return new Response(null, { status: 503 });
      },
      sleep: async () => {},
    },
  );

  assert.equal(notFound.status, 404);
  assert.equal(unavailable.status, 503);
  assert.equal(getCalls, 1);
  assert.equal(postCalls, 1);
});

test("retries network failures up to the configured attempt limit", async () => {
  let calls = 0;
  const delays = [];

  await assert.rejects(
    fetchWithRetry(
      "https://example.com/models",
      {},
      {
        maxAttempts: 3,
        fetchImpl: async () => {
          calls += 1;
          throw new TypeError("fetch failed");
        },
        sleep: async (delayMs) => {
          delays.push(delayMs);
        },
        random: () => 0.5,
        baseDelayMs: 50,
      },
    ),
    /fetch failed/,
  );

  assert.equal(calls, 3);
  assert.deepEqual(delays, [50, 100]);
});
