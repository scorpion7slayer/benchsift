import { createFileRoute } from "@tanstack/react-router";
import { authMarkdown } from "@/lib/agent-discovery";

export const Route = createFileRoute("/auth.md")({
  server: {
    handlers: {
      GET: () =>
        new Response(authMarkdown, {
          headers: {
            "content-type": "text/markdown; charset=utf-8",
            "cache-control": "public, max-age=3600, s-maxage=3600",
          },
        }),
    },
  },
});

