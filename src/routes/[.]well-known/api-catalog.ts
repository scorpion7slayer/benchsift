import { createFileRoute } from "@tanstack/react-router";
import { apiCatalogLinkset } from "@/lib/agent-discovery";

export const Route = createFileRoute("/.well-known/api-catalog")({
  server: {
    handlers: {
      GET: () =>
        Response.json(apiCatalogLinkset(), {
          headers: {
            "content-type": "application/linkset+json; charset=utf-8",
            "cache-control": "public, max-age=3600, s-maxage=3600",
          },
        }),
    },
  },
});

