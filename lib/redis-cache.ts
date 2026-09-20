import "@tanstack/react-start/server-only";

// Bun 1.3.14 provides the Redis client in the production runtime: no extra SDK.
// Structural types keep Node builds usable when Redis is not configured.
interface Client {
  connect(): Promise<void>;
  send(command: string, args: string[]): Promise<unknown>;
  close(): void;
}
type Constructor = new (
  url: string,
  options: Record<string, unknown>,
) => Client;
let connection: Promise<Client> | undefined;
let retryAfter = 0;
let configuredUrl: string | undefined;

async function client(): Promise<Client | null> {
  const url = process.env.REDIS_URL;
  if (!url || Date.now() < retryAfter) return null;
  if (configuredUrl !== url) {
    if (connection) void connection.then((c) => c.close()).catch(() => {});
    connection = undefined;
    configuredUrl = url;
  }
  if (!connection) {
    connection = (async () => {
      const runtime = globalThis as typeof globalThis & {
        Bun?: { RedisClient?: Constructor };
      };
      const RedisClient = runtime.Bun?.RedisClient;
      if (!RedisClient) throw new Error("Redis requires Bun 1.3.14 or newer");
      const c = new RedisClient(url, {
        connectionTimeout: 500,
        maxRetries: 0,
        enableOfflineQueue: false,
        autoReconnect: false,
      });
      try {
        await c.connect();
      } catch (error) {
        c.close();
        throw error;
      }
      return c;
    })();
  }
  return connection;
}

/** Deadline + circuit breaker: a Redis outage must not hold catalogue requests. */
export async function redisCommand(
  command: string,
  args: string[],
): Promise<unknown | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      (async () => {
        const active = await client();
        return active ? active.send(command, args) : null;
      })(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("Redis deadline")), 800);
      }),
    ]);
  } catch {
    retryAfter = Date.now() + 30_000;
    if (connection) void connection.then((c) => c.close()).catch(() => {});
    connection = undefined;
    return null;
  } finally {
    clearTimeout(timer);
  }
}
