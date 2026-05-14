// Drop-in replacement for Next.js `unstable_cache`.
//
// `unstable_cache(fn, keyParts, { revalidate })` memoised a function across
// requests via Next's data cache. Here we reproduce the same contract with a
// two-tier cache:
//   1. an in-memory Map (per worker isolate — fast, but short-lived)
//   2. the Cloudflare KV namespace (shared across isolates, survives restarts)
//
// Semantics match `unstable_cache`: results are served until `revalidate`
// seconds elapse, then the underlying function runs again.
import { getModelsKV } from "@/lib/cf-env";

interface Entry<T> {
  value: T;
  expires: number; // ms epoch
}

const memory = new Map<string, Entry<unknown>>();

/**
 * Wraps an async function with a revalidating cache.
 *
 * @param fn         the function to memoise
 * @param keyParts   stable parts identifying this cache slot
 * @param options    `revalidate` — seconds before the cache is considered stale
 */
export function cached<Args extends unknown[], T>(
  fn: (...args: Args) => Promise<T>,
  keyParts: string[],
  options: { revalidate: number },
): (...args: Args) => Promise<T> {
  const ttlMs = options.revalidate * 1000;

  return async (...args: Args): Promise<T> => {
    const key = ["cache", ...keyParts, ...args.map((a) => String(a))].join(":");
    const now = Date.now();

    // 1. In-memory hit.
    const mem = memory.get(key);
    if (mem && mem.expires > now) return mem.value as T;

    // 2. KV hit — promote into memory.
    const kv = getModelsKV();
    if (kv) {
      try {
        const stored = await kv.get<{ value: T; refreshedAt: number }>(key, "json");
        if (stored && stored.refreshedAt + ttlMs > now) {
          memory.set(key, { value: stored.value, expires: stored.refreshedAt + ttlMs });
          return stored.value;
        }
      } catch {
        // Ignore KV read failures — fall through to a fresh computation.
      }
    }

    // 3. Miss — compute, then populate both tiers.
    const value = await fn(...args);
    memory.set(key, { value, expires: now + ttlMs });
    if (kv) {
      try {
        await kv.put(
          key,
          JSON.stringify({ value, refreshedAt: now }),
          // Keep the KV entry a little past the logical TTL as a stale buffer.
          { expirationTtl: Math.max(options.revalidate * 2, 60) },
        );
      } catch {
        // Best-effort write — a failed put just means the next call recomputes.
      }
    }
    return value;
  };
}
