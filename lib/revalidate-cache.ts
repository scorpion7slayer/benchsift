// Small server-side revalidating cache for long-running Node processes.
//
// This replaces the former Cloudflare KV tier. On Dokploy the process is
// stateful, so an in-memory cache avoids repeated upstream fetches while the
// catalog-specific cache in `cron-cache.ts` handles persistence.

interface Entry<T> {
  value: T;
  expires: number; // ms epoch
}

const memory = new Map<string, Entry<unknown>>();

/**
 * Wraps an async function with a revalidating in-memory cache.
 *
 * @param fn         the function to memoise
 * @param keyParts   stable parts identifying this cache slot
 * @param options    `revalidate` - seconds before the cache is considered stale
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
    const mem = memory.get(key);
    if (mem && mem.expires > now) return mem.value as T;

    const value = await fn(...args);
    memory.set(key, { value, expires: now + ttlMs });
    return value;
  };
}
