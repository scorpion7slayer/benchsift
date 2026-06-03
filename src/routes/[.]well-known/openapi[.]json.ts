import { createFileRoute } from "@tanstack/react-router";
import { openApiDocument } from "@/lib/agent-discovery";

export const Route = createFileRoute("/.well-known/openapi.json")({
  server: {
    handlers: {
      GET: () =>
        Response.json(openApiDocument(), {
          headers: {
            "content-type": "application/openapi+json; charset=utf-8",
            "cache-control": "public, max-age=3600, s-maxage=3600",
          },
        }),
    },
  },
});

