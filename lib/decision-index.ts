import "@tanstack/react-start/server-only";

import { fetchWithRetry } from "./fetch-with-retry";
import { cached } from "@/lib/revalidate-cache";
import { parseDecisionIndex, type DecisionIndexData } from "./decision-index-data";
export type { DecisionIndexData, DecisionIndexRow } from "./decision-index-data";

const DECISION_INDEX_URL = "https://artificialanalysis.ai/evaluations/artificial-analysis-decision-index";
const FETCH_TIMEOUT_MS = 8_000;
const CACHE_SECONDS = 21_600; // 6h

const getDecisionIndexDataCached = cached(
  async (): Promise<DecisionIndexData> => {
    const res = await fetchWithRetry(
      DECISION_INDEX_URL,
      {
        headers: {
          RSC: "1",
          Accept: "text/x-component, */*",
          "User-Agent": "BenchSift/1.0 (+https://benchsift.nxtaigen.com)",
        },
      },
      { timeoutMs: FETCH_TIMEOUT_MS, maxAttempts: 2 },
    );
    if (!res.ok) throw new Error("Decision Index source unavailable");
    const rows = parseDecisionIndex(await res.text());
    if (!rows.length) throw new Error("Decision Index source unavailable");
    return { rows };
  },
  ["decision-index-data"],
  { revalidate: CACHE_SECONDS },
);

let retryAt = 0;
export async function getDecisionIndexData(): Promise<DecisionIndexData> {
  if (Date.now() < retryAt) return { rows: [] };
  try {
    return await getDecisionIndexDataCached();
  } catch {
    retryAt = Date.now() + 30_000;
    return { rows: [] };
  }
}
