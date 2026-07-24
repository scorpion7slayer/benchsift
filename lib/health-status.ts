import type { ModelsCacheSummary } from "@/lib/cron-cache";

export const HEALTHY_CACHE_MAX_AGE_SECONDS = 30 * 60 * 60;

type PublicCatalogStatus = "ready" | "stale" | "unavailable";

function stat(
  stats: Record<string, number> | undefined,
  key: string,
): number | null {
  const value = stats?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function catalogStatus(summary: ModelsCacheSummary): PublicCatalogStatus {
  if (!summary.valid || !summary.exists || summary.count === undefined) {
    return "unavailable";
  }
  if (
    summary.ageSeconds === undefined ||
    summary.ageSeconds > HEALTHY_CACHE_MAX_AGE_SECONDS
  ) {
    return "stale";
  }
  return "ready";
}

/**
 * Converts the private cache summary into a stable public payload. Filesystem
 * paths, schema keys, and internal error messages are intentionally omitted.
 */
export function buildPublicHealth(
  summary: ModelsCacheSummary,
  observedAt = new Date().toISOString(),
) {
  const status = catalogStatus(summary);
  const stats = summary.stats;

  return {
    ok: true as const,
    status: status === "ready" ? "healthy" as const : "degraded" as const,
    service: "benchsift",
    observedAt,
    catalog: {
      status,
      models: summary.count ?? 0,
      refreshedAt: summary.refreshedAt ?? null,
      ageSeconds: summary.ageSeconds ?? null,
      healthyMaxAgeSeconds: HEALTHY_CACHE_MAX_AGE_SECONDS,
    },
    sources: {
      artificialAnalysis: {
        apiModels: stat(stats, "apiModels"),
        mediaModels: stat(stats, "mediaModels"),
        sitemapSlugs: stat(stats, "sitemapSlugs"),
        builtPartialModels: stat(stats, "builtPartialModels"),
      },
      openRouter: {
        enrichedModels: stat(stats, "openRouterEnrichedModels"),
      },
      huggingFace: {
        enrichedModels: stat(stats, "huggingFaceEnrichedModels"),
      },
    },
    coverage: {
      openWeightModels: stat(stats, "openWeightModels"),
      parameterizedModels: stat(stats, "parameterizedModels"),
      retainedHistoricalModels: stat(stats, "retainedHistoricalModels"),
    },
    network: {
      transientRetries: stat(stats, "transientRetries"),
    },
  };
}
