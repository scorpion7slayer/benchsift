import assert from "node:assert/strict";
import test from "node:test";

import {
  buildPublicHealth,
  HEALTHY_CACHE_MAX_AGE_SECONDS,
} from "./health-status.ts";

test("publishes a sanitized healthy cache summary with source coverage", () => {
  const health = buildPublicHealth(
    {
      cacheFile: "/private/models-cache.json",
      exists: true,
      valid: true,
      fresh: true,
      key: "private-schema-key",
      count: 1_024,
      refreshedAt: "2026-07-24T08:00:00.000Z",
      ageSeconds: 3_600,
      stats: {
        apiModels: 880,
        mediaModels: 140,
        sitemapSlugs: 1_010,
        builtPartialModels: 34,
        openRouterEnrichedModels: 760,
        huggingFaceEnrichedModels: 310,
        openWeightModels: 340,
        parameterizedModels: 290,
        retainedHistoricalModels: 12,
        transientRetries: 2,
      },
    },
    "2026-07-24T09:00:00.000Z",
  );

  assert.equal(health.status, "healthy");
  assert.equal(health.catalog.status, "ready");
  assert.equal(health.catalog.models, 1_024);
  assert.equal(health.sources.openRouter.enrichedModels, 760);
  assert.equal(health.coverage.parameterizedModels, 290);
  assert.equal(health.network.transientRetries, 2);
  assert.equal(health.catalog.healthyMaxAgeSeconds, HEALTHY_CACHE_MAX_AGE_SECONDS);

  const serialized = JSON.stringify(health);
  assert.doesNotMatch(serialized, /models-cache|private-schema-key|cacheFile/);
});

test("keeps liveness healthy while exposing a degraded catalog", () => {
  const stale = buildPublicHealth({
    cacheFile: "/private/models-cache.json",
    exists: true,
    valid: true,
    fresh: true,
    count: 980,
    ageSeconds: HEALTHY_CACHE_MAX_AGE_SECONDS + 1,
  });
  const unavailable = buildPublicHealth({
    cacheFile: "/private/models-cache.json",
    exists: false,
    valid: false,
    fresh: false,
    error: "sensitive filesystem failure",
  });

  assert.equal(stale.ok, true);
  assert.equal(stale.status, "degraded");
  assert.equal(stale.catalog.status, "stale");

  assert.equal(unavailable.ok, true);
  assert.equal(unavailable.status, "degraded");
  assert.equal(unavailable.catalog.status, "unavailable");
  assert.equal(unavailable.catalog.models, 0);
  assert.doesNotMatch(JSON.stringify(unavailable), /sensitive|filesystem|private/);
});
