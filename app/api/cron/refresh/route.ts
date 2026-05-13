import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { refreshKVCache } from "@/lib/cron-refresh";

// Force dynamic — must run on every invocation, never cached.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function unauthorized(reason: string) {
  return new NextResponse(JSON.stringify({ error: reason }), {
    status: 401,
    headers: { "content-type": "application/json" },
  });
}

async function handle(request: Request) {
  const { env } = getCloudflareContext();
  const expected = (env as unknown as { CRON_SECRET?: string }).CRON_SECRET;
  if (!expected) return unauthorized("CRON_SECRET not configured");

  const header = request.headers.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!provided || provided !== expected) return unauthorized("invalid token");

  const result = await refreshKVCache(env);
  return NextResponse.json({ ok: true, ...result });
}

export async function POST(request: Request) {
  return handle(request);
}

export async function GET(request: Request) {
  // Allow GET for manual testing via `curl -H "authorization: Bearer …"`.
  return handle(request);
}
