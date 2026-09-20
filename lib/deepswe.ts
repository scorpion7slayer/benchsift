import "@tanstack/react-start/server-only";

import { fetchWithRetry } from "./fetch-with-retry";
import { cached } from "@/lib/revalidate-cache";

const DEEPSWE_ARTIFACT_BASE = "https://deepswe.datacurve.ai/artifacts";
const FETCH_TIMEOUT_MS = 8_000;
const CACHE_SECONDS = 21_600; // 6h

import {
  DEEPSWE_VERSIONS,
  normalizeLeaderboard,
  normalizeComparison,
  type DeepSweData,
} from "./deepswe-data";
export type { DeepSweData, DeepSweRow, DeepSweVersion } from "./deepswe-data";

async function fetchArtifact<T>(path: string): Promise<T | null> {
  try {
    const res = await fetchWithRetry(
      `${DEEPSWE_ARTIFACT_BASE}/${path}.json`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "BenchSift/1.0 (+https://benchsift.nxtaigen.com)",
        },
      },
      { timeoutMs: FETCH_TIMEOUT_MS, maxAttempts: 2 },
    );
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

const getDeepSweDataCached = cached(
  async (): Promise<DeepSweData> => {
    const [v11, v1, delta] = await Promise.all([
      fetchArtifact<Parameters<typeof normalizeLeaderboard>[1]>(
        "v1.1/leaderboard-live",
      ),
      fetchArtifact<Parameters<typeof normalizeLeaderboard>[1]>(
        "v1/leaderboard-live",
      ),
      fetchArtifact<Parameters<typeof normalizeComparison>[0]>("v1.1/v1-delta"),
    ]);
    const current = normalizeLeaderboard(DEEPSWE_VERSIONS[0], v11);
    if (!current.rows.length) throw new Error("DeepSWE source unavailable");
    return {
      leaderboards: [current, normalizeLeaderboard(DEEPSWE_VERSIONS[1], v1)],
      comparison: normalizeComparison(delta),
    };
  },
  ["deepswe-versioned-data"],
  { revalidate: CACHE_SECONDS },
);

let retryAt = 0;
const unavailable = (): DeepSweData => ({
  leaderboards: DEEPSWE_VERSIONS.map((version) =>
    normalizeLeaderboard(version, null),
  ),
  comparison: null,
});
export async function getDeepSweData(): Promise<DeepSweData> {
  if (Date.now() < retryAt) return unavailable();
  try {
    return await getDeepSweDataCached();
  } catch {
    retryAt = Date.now() + 30_000;
    return unavailable();
  }
}
