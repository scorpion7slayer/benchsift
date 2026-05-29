// Manual refresh trigger. In Dokploy, schedule an external cron job to call
// this endpoint with `Authorization: Bearer <CRON_SECRET>`.
import { createFileRoute } from "@tanstack/react-router";
import { refreshModelsCache } from "@/lib/api";

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
  const expected = process.env.CRON_SECRET;
  if (!expected) return unauthorized("CRON_SECRET not configured");

  const header = request.headers.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!provided || !timingSafeEqual(provided, expected)) return unauthorized("invalid token");

  const started = Date.now();
  const result = await refreshModelsCache();
  return Response.json({ ok: true, ...result, durationMs: Date.now() - started });
}

export const Route = createFileRoute("/api/cron/refresh")({
  server: {
    handlers: {
      GET: () => methodNotAllowed(),
      POST: ({ request }) => handle(request),
    },
  },
});
