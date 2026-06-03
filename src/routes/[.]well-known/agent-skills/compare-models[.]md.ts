import { createFileRoute } from "@tanstack/react-router";
import { getAgentSkill } from "@/lib/agent-discovery";

export const Route = createFileRoute("/.well-known/agent-skills/compare-models.md")({
  server: {
    handlers: {
      GET: () =>
        new Response(getAgentSkill("compare-models")?.content ?? "Not found", {
          status: getAgentSkill("compare-models") ? 200 : 404,
          headers: {
            "content-type": "text/markdown; charset=utf-8",
            "cache-control": "public, max-age=3600, s-maxage=3600",
          },
        }),
    },
  },
});

