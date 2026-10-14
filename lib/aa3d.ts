import "@tanstack/react-start/server-only";

import { fetchWithRetry } from "./fetch-with-retry";
import { cached } from "@/lib/revalidate-cache";
import { parseAa3dPage, type Aa3dData } from "./aa3d-data";
export type { Aa3dData, Aa3dRow, Aa3dTask } from "./aa3d-data";

const AA3D_URL = "https://artificialanalysis.ai/evaluations/aa-3d";
const FETCH_TIMEOUT_MS = 8_000;
const CACHE_SECONDS = 21_600; // 6h
const EMPTY: Aa3dData = { rows: [], domains: [], tasks: [], panel_votes: null };

const getAa3dDataCached = cached(
  async (): Promise<Aa3dData> => {
    const res = await fetchWithRetry(
      AA3D_URL,
      {
        headers: {
          RSC: "1",
          Accept: "text/x-component, */*",
          "User-Agent": "BenchSift/1.0 (+https://benchsift.nxtaigen.com)",
        },
      },
      { timeoutMs: FETCH_TIMEOUT_MS, maxAttempts: 2 },
    );
    if (!res.ok) throw new Error("AA-3D source unavailable");
    const data = parseAa3dPage(await res.text());
    if (!data.rows.length) throw new Error("AA-3D source unavailable");
    return data;
  },
  ["aa3d-data"],
  { revalidate: CACHE_SECONDS },
);

let retryAt = 0;
export async function getAa3dData(): Promise<Aa3dData> {
  if (Date.now() < retryAt) return EMPTY;
  try {
    return await getAa3dDataCached();
  } catch {
    retryAt = Date.now() + 30_000;
    return EMPTY;
  }
}
