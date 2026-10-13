import "@tanstack/react-start/server-only";

import { fetchWithRetry } from "./fetch-with-retry";
import { cached } from "@/lib/revalidate-cache";
import { parseFrontierCode, type FrontierCodeData } from "./frontiercode-data";
export type { FrontierCodeData, FrontierCodeRow } from "./frontiercode-data";

const FRONTIERCODE_URL = "https://artificialanalysis.ai/evaluations/frontiercode";
const FETCH_TIMEOUT_MS = 8_000;
const CACHE_SECONDS = 21_600; // 6h

const getFrontierCodeDataCached = cached(
  async (): Promise<FrontierCodeData> => {
    const res = await fetchWithRetry(
      FRONTIERCODE_URL,
      {
        headers: {
          RSC: "1",
          Accept: "text/x-component, */*",
          "User-Agent": "BenchSift/1.0 (+https://benchsift.nxtaigen.com)",
        },
      },
      { timeoutMs: FETCH_TIMEOUT_MS, maxAttempts: 2 },
    );
    if (!res.ok) throw new Error("FrontierCode source unavailable");
    const rows = parseFrontierCode(await res.text());
    if (!rows.length) throw new Error("FrontierCode source unavailable");
    return { rows };
  },
  ["frontiercode-data"],
  { revalidate: CACHE_SECONDS },
);

let retryAt = 0;
export async function getFrontierCodeData(): Promise<FrontierCodeData> {
  if (Date.now() < retryAt) return { rows: [] };
  try {
    return await getFrontierCodeDataCached();
  } catch {
    retryAt = Date.now() + 30_000;
    return { rows: [] };
  }
}
