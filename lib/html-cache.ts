import "@tanstack/react-start/server-only";

/*
 * Server-side cache of rendered model pages (stale-while-revalidate).
 *
 * Crawlers render the whole document before the first byte (TanStack waits
 * for every streamed promise when the user agent is a bot), so an uncached
 * model page costs one upstream scrape per visit. Anonymous requests — no
 * cookie, so no saved theme, language or consent — all receive the same
 * document; it is kept in memory and in Redis and served at once, then
 * refreshed in the background once it is older than its freshness window.
 *
 * Visitors with cookies are always rendered for themselves. Documents are
 * never marked public, so a shared proxy cannot hand an anonymous render to a
 * visitor whose cookies would change it.
 */

import { AsyncLocalStorage } from "node:async_hooks";
import { gunzipSync, gzipSync } from "node:zlib";
import { redisCommand } from "@/lib/redis-cache";

/** A complete render stays fresh this long. */
export const FRESH_MS = 10 * 60_000;
/** A render that missed streamed data is retried soon. */
export const PARTIAL_FRESH_MS = 30_000;
/** A stale render is still served, while it refreshes, up to this age. */
export const STALE_MS = 24 * 60 * 60_000;
/** Time streamed data gets inside a cached render before it is left out. */
export const RENDER_BUDGET_MS = 400;
/** Pages kept in this process (about 110 KB each); Redis keeps the rest. */
const MAX_ENTRIES = 300;

const MODEL_PAGE = /^\/(?:fr\/)?models\/[A-Za-z0-9][A-Za-z0-9._-]{1,119}$/;

export interface CachedPage {
  status: number;
  headers: [string, string][];
  body: string;
  storedAt: number;
  freshUntil: number;
}

/** The cache key of a request whose render can be shared, or null. */
export function htmlCacheKey(request: Request): string | null {
  if (request.method !== "GET") return null;
  if (request.headers.get("cookie")) return null;
  if (request.headers.get("authorization")) return null;
  const url = new URL(request.url);
  if (url.search) return null;
  return MODEL_PAGE.test(url.pathname) ? url.pathname : null;
}

/** Whether a response may be stored for anonymous visitors. */
export function isStorableResponse(response: Response): boolean {
  return response.status === 200 &&
    (response.headers.get("content-type") ?? "").startsWith("text/html") &&
    !response.headers.has("set-cookie");
}

export type CacheState = "fresh" | "stale" | "expired";

export function cacheState(entry: CachedPage, now: number): CacheState {
  if (now < entry.freshUntil) return "fresh";
  return now - entry.storedAt < STALE_MS ? "stale" : "expired";
}

// ─── Render scope ───────────────────────────────────────────────────────────

interface RenderScope { partial: boolean }
const renderScope = new AsyncLocalStorage<RenderScope>();

/**
 * Inside a cached render, resolves to `fallback` if `promise` takes longer
 * than the render budget, and marks the render as partial so it is retried
 * soon. The promise keeps running and fills its own upstream cache. Outside a
 * cached render it is returned untouched.
 */
export function withinRenderBudget<T>(promise: Promise<T>, fallback: T): Promise<T> {
  const scope = renderScope.getStore();
  if (!scope) return promise;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<T>((resolve) => {
    timer = setTimeout(() => {
      scope.partial = true;
      resolve(fallback);
    }, RENDER_BUDGET_MS);
  });
  promise.catch(() => {});
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

// ─── Store ──────────────────────────────────────────────────────────────────
//
// Two levels: this process's memory for the hottest pages, and Redis (when
// REDIS_URL is set) so renders survive a redeploy and are shared by every
// container. Redis holds the document gzip-compressed; a Redis outage only
// means memory alone, through the deadline and breaker of `redisCommand`.

/** Storage shared across processes; Redis in production. */
export interface SharedHtmlStore {
  /** Values of `keys`, in order (null when absent), or null when unavailable. */
  get(keys: string[]): Promise<(string | null)[] | null>;
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
}

const redisStore: SharedHtmlStore = {
  async get(keys) {
    if (!process.env.REDIS_URL) return null;
    const values = await redisCommand("MGET", keys);
    return Array.isArray(values) ? values.map((value) => (typeof value === "string" ? value : null)) : null;
  },
  async set(key, value, ttlSeconds) {
    if (!process.env.REDIS_URL) return;
    await redisCommand("SET", [key, value, "EX", String(ttlSeconds)]);
  },
};

let shared: SharedHtmlStore = redisStore;

/** Replaces the shared store (tests). */
export function setSharedHtmlStore(store: SharedHtmlStore): void {
  shared = store;
}

const KEY_PREFIX = "benchsift:html:v1:";
/** Time of the last catalogue refresh: pages stored before it are stale. */
const EPOCH_KEY = `${KEY_PREFIX}epoch`;
const SHARED_TTL_SECONDS = Math.ceil(STALE_MS / 1000);

const entries = new Map<string, CachedPage>();
const revalidating = new Set<string>();
let localEpoch = 0;

function remember(key: string, page: CachedPage): void {
  entries.delete(key);
  entries.set(key, page);
  while (entries.size > MAX_ENTRIES) {
    const oldest = entries.keys().next().value;
    if (oldest === undefined) break;
    entries.delete(oldest);
  }
}

function encode(page: CachedPage): string {
  return JSON.stringify({ ...page, body: gzipSync(page.body).toString("base64") });
}

function decode(raw: string): CachedPage | null {
  try {
    const value = JSON.parse(raw) as CachedPage;
    if (typeof value?.body !== "string" || typeof value.storedAt !== "number" || typeof value.freshUntil !== "number" || !Array.isArray(value.headers)) return null;
    return { ...value, body: gunzipSync(Buffer.from(value.body, "base64")).toString("utf8") };
  } catch {
    return null;
  }
}

function stored(key: string, page: CachedPage): void {
  remember(key, page);
  void shared.set(KEY_PREFIX + key, encode(page), SHARED_TTL_SECONDS).catch(() => {});
}

/** The page in memory, else in the shared store (then kept in memory). */
async function lookup(key: string): Promise<CachedPage | null> {
  const local = entries.get(key);
  if (local) {
    if (local.storedAt < localEpoch) local.freshUntil = 0;
    return local;
  }
  const [raw, epoch] = (await shared.get([KEY_PREFIX + key, EPOCH_KEY]).catch(() => null)) ?? [];
  const page = raw ? decode(raw) : null;
  if (!page) return null;
  if (page.storedAt < Math.max(localEpoch, Number(epoch) || 0)) page.freshUntil = 0;
  remember(key, page);
  return page;
}

/**
 * Marks every stored page stale, e.g. once the catalogue has been refreshed:
 * each is still served once more while it renders again with the new data.
 */
export async function expireHtmlCache(): Promise<void> {
  localEpoch = Date.now();
  for (const page of entries.values()) page.freshUntil = 0;
  await shared.set(EPOCH_KEY, String(localEpoch), SHARED_TTL_SECONDS).catch(() => {});
}

/** Forgets the pages held in memory, as a restart does (tests). */
export function dropLocalHtmlCache(): void {
  entries.clear();
}

function toResponse(page: CachedPage, state: string): Response {
  const headers = new Headers(page.headers);
  headers.set("x-benchsift-cache", state);
  headers.set("age", String(Math.max(0, Math.floor((Date.now() - page.storedAt) / 1000))));
  return new Response(page.body, { status: page.status, headers });
}

/** Renders once, inside a scope, and stores the document when it can be shared. */
async function renderAndStore(key: string, render: () => Promise<Response>): Promise<{ response: Response; page: CachedPage | null }> {
  const scope: RenderScope = { partial: false };
  const response = await renderScope.run(scope, render);
  if (!isStorableResponse(response)) return { response, page: null };
  const body = await response.text();
  const now = Date.now();
  const headers = [...response.headers].filter(([name]) => !["content-length", "transfer-encoding"].includes(name.toLowerCase()));
  const page: CachedPage = {
    status: response.status,
    headers,
    body,
    storedAt: now,
    freshUntil: now + (scope.partial ? PARTIAL_FRESH_MS : FRESH_MS),
  };
  stored(key, page);
  return { response: toResponse(page, "MISS"), page };
}

/**
 * Serves `request` from the cache when it can be shared: a fresh copy at
 * once, a stale copy at once while one background render replaces it, or a
 * new render that is then stored.
 */
export async function serveWithHtmlCache(request: Request, render: () => Promise<Response>): Promise<Response> {
  const key = htmlCacheKey(request);
  if (!key) return render();

  const entry = await lookup(key);
  const state = entry ? cacheState(entry, Date.now()) : "expired";
  if (entry && state === "fresh") return toResponse(entry, "HIT");
  if (entry && state === "stale") {
    if (!revalidating.has(key)) {
      revalidating.add(key);
      renderAndStore(key, render)
        .then(({ page }) => { if (!page) entries.delete(key); })
        .catch(() => {})
        .finally(() => revalidating.delete(key));
    }
    return toResponse(entry, "STALE");
  }
  return (await renderAndStore(key, render)).response;
}
