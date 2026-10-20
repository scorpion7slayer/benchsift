import "@tanstack/react-start/server-only";

import { fetchWithRetry } from "./fetch-with-retry";
import { cached } from "@/lib/revalidate-cache";
import { EMPTY_ROBOTICS_MEDIA, parseAARobotics, roboticsChunkPath, type RoboticsData } from "./aa-robotics-data";
export type { RoboticsData, RoboticsRow, RoboticsTask } from "./aa-robotics-data";

const AA_ORIGIN = "https://artificialanalysis.ai";
const ARTICLE_URL = `${AA_ORIGIN}/articles/aa-robotics`;
const FETCH_TIMEOUT_MS = 8_000;
const CACHE_SECONDS = 21_600; // 6h
const USER_AGENT = "BenchSift/1.0 (+https://benchsift.nxtaigen.com)";
const EMPTY: RoboticsData = { version: null, tasks: [], rows: [], human: null, media: EMPTY_ROBOTICS_MEDIA };

async function fetchText(url: string, accept: string, rsc: boolean): Promise<string> {
  const res = await fetchWithRetry(
    url,
    { headers: { ...(rsc ? { RSC: "1" } : {}), Accept: accept, "User-Agent": USER_AGENT } },
    { timeoutMs: FETCH_TIMEOUT_MS, maxAttempts: 2 },
  );
  if (!res.ok) throw new Error("AA-Robotics source unavailable");
  return res.text();
}

const getRoboticsDataCached = cached(
  async (): Promise<RoboticsData> => {
    // The article's RSC payload names the hashed page chunk that holds the data.
    const payload = await fetchText(ARTICLE_URL, "text/x-component, */*", true);
    const chunk = roboticsChunkPath(payload);
    if (!chunk) throw new Error("AA-Robotics source unavailable");
    const data = parseAARobotics(
      await fetchText(new URL(`/_next/${chunk}`, AA_ORIGIN).href, "application/javascript, */*", false),
      payload,
    );
    if (!data.rows.length) throw new Error("AA-Robotics source unavailable");
    return data;
  },
  ["aa-robotics-data"],
  { revalidate: CACHE_SECONDS },
);

let retryAt = 0;
export async function getRoboticsData(): Promise<RoboticsData> {
  if (Date.now() < retryAt) return EMPTY;
  try {
    return await getRoboticsDataCached();
  } catch {
    retryAt = Date.now() + 30_000;
    return EMPTY;
  }
}
