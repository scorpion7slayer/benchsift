// Cloudflare Workers entry point.
//
// - Reuses the TanStack Start fetch handler for user requests.
// - Adds a `scheduled` handler that warms the KV cache directly, so the cron
//   benefits from its own CPU budget instead of being capped by `limits.cpu_ms`
//   in `wrangler.jsonc` (which only applies to the fetch handler).
import handler from "@tanstack/react-start/server-entry";
import { refreshKVCache } from "@/lib/cron-refresh";

const LEGACY_HOSTNAME = "nxtaicard.nxtaigen.com";
const PRIMARY_HOSTNAME = "benchsift.nxtaigen.com";

export default {
  fetch(request: Request): Response | Promise<Response> {
    const url = new URL(request.url);

    if (url.hostname === LEGACY_HOSTNAME) {
      url.protocol = "https:";
      url.hostname = PRIMARY_HOSTNAME;
      return Response.redirect(url.toString(), 301);
    }

    return handler.fetch(request);
  },

  async scheduled(
    _event: ScheduledController,
    env: CloudflareEnv,
    ctx: ExecutionContext,
  ): Promise<void> {
    ctx.waitUntil(
      refreshKVCache(env)
        .then((r) =>
          console.log(`cron: refreshed ${r.count} models in ${r.durationMs}ms`),
        )
        .catch((e) => console.error("cron: refresh failed:", e)),
    );
  },
} satisfies ExportedHandler<CloudflareEnv>;
