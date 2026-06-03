import { createFileRoute } from "@tanstack/react-router";
import { mcpServerCard } from "@/lib/agent-discovery";

export const Route = createFileRoute("/.well-known/mcp/server-card.json")({
  server: {
    handlers: {
      GET: () =>
        Response.json(mcpServerCard(), {
          headers: {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "public, max-age=3600, s-maxage=3600",
          },
        }),
    },
  },
});

