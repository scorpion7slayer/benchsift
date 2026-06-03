import { createFileRoute } from "@tanstack/react-router";
import { apiDocsMarkdown } from "@/lib/agent-discovery";

export const Route = createFileRoute("/docs/api")({
  server: {
    handlers: {
      GET: () =>
        new Response(apiDocsMarkdown, {
          headers: {
            "content-type": "text/markdown; charset=utf-8",
            "cache-control": "public, max-age=3600, s-maxage=3600",
          },
        }),
    },
  },
});

