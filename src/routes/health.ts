import { createFileRoute } from "@tanstack/react-router";
import { readModelsCacheSummary } from "@/lib/cron-cache";
import { buildPublicHealth } from "@/lib/health-status";

export const Route = createFileRoute("/health")({
  server: {
    handlers: {
      GET: async () => {
        const summary = await readModelsCacheSummary();
        return Response.json(buildPublicHealth(summary), {
          headers: {
            "cache-control": "no-store",
          },
        });
      },
    },
  },
});
