// Bounded, single-flight cache for server data. Rejected fetches are never cached.
interface Entry<T> {
  value: T;
  expires: number;
}
const memory = new Map<string, Entry<unknown>>();
const pending = new Map<string, Promise<unknown>>();
const MAX_ENTRIES = 128;
let expiryTimer: ReturnType<typeof setTimeout> | undefined;

function scheduleExpiry() {
  clearTimeout(expiryTimer);
  if (!memory.size) return;
  const nextExpiry = Math.min(...Array.from(memory.values(), (entry) => entry.expires));
  expiryTimer = setTimeout(() => {
    const now = Date.now();
    for (const [key, entry] of memory) {
      if (entry.expires <= now) memory.delete(key);
    }
    scheduleExpiry();
  }, Math.min(2_147_483_647, Math.max(1, nextExpiry - Date.now())));
  expiryTimer.unref();
}

export function cached<Args extends unknown[], T>(
  fn: (...args: Args) => Promise<T>,
  keyParts: string[],
  options: { revalidate: number },
): (...args: Args) => Promise<T> {
  return async (...args: Args): Promise<T> => {
    const key = JSON.stringify([keyParts, args]);
    const entry = memory.get(key);
    if (entry && entry.expires > Date.now()) {
      // Promote hits so frequently used data survives a burst of detail requests.
      memory.delete(key);
      memory.set(key, entry);
      return entry.value as T;
    }
    memory.delete(key);
    const active = pending.get(key);
    if (active) return active as Promise<T>;
    const request = Promise.resolve()
      .then(() => fn(...args))
      .then((value) => {
        // Zero TTL shares concurrent work without retaining a second catalogue.
        if (options.revalidate <= 0) return value;
        memory.delete(key);
        if (memory.size >= MAX_ENTRIES)
          memory.delete(memory.keys().next().value!);
        memory.set(key, {
          value,
          expires: Date.now() + options.revalidate * 1000,
        });
        scheduleExpiry();
        return value;
      })
      .finally(() => pending.delete(key));
    pending.set(key, request);
    return request;
  };
}
