// Manual cron trigger — HTTP endpoint to refresh the KV models cache.
// The automatic refresh runs from the `scheduled` handler in `src/server.ts`;
// this route exists for manual testing via `curl -X POST -H "authorization: Bearer …"`.
import { createFileRoute } from "@tanstack/react-router";
import { getCfEnv } from "@/lib/cf-env";
import { refreshKVCache } from "@/lib/cron-refresh";

function unauthorized(reason: string): Response {
  return new Response(JSON.stringify({ error: reason }), {
    status: 401,
    headers: { "content-type": "application/json" },
  });
}

function methodNotAllowed(): Response {
  return new Response(JSON.stringify({ error: "method not allowed" }), {
    status: 405,
    headers: {
      "content-type": "application/json",
      "allow": "POST",
    },
  });
}

function timingSafeEqual(a: string, b: string): boolean {
  const max = Math.max(a.length, b.length);
  let mismatch = a.length ^ b.length;
  for (let i = 0; i < max; i++) {
    mismatch |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return mismatch === 0;
}

async function handle(request: Request): Promise<Response> {
  const env = getCfEnv();
  if (!env) return unauthorized("Cloudflare environment unavailable");

  const expected = env.CRON_SECRET;
  if (!expected) return unauthorized("CRON_SECRET not configured");

  const header = request.headers.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!provided || !timingSafeEqual(provided, expected)) return unauthorized("invalid token");

  const result = await refreshKVCache(env);
  return Response.json({ ok: true, ...result });
}

export const Route = createFileRoute("/api/cron/refresh")({
  server: {
    handlers: {
      GET: () => methodNotAllowed(),
      POST: ({ request }) => handle(request),
    },
  },
});
