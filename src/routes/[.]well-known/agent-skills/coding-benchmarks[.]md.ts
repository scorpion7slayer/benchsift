import { createFileRoute } from "@tanstack/react-router";
import { getAgentSkill } from "@/lib/agent-discovery";

export const Route = createFileRoute(
  "/.well-known/agent-skills/coding-benchmarks.md",
)({
  server: {
    handlers: {
      GET: () =>
        new Response(getAgentSkill("coding-benchmarks")?.content ?? "Not found", {
          status: getAgentSkill("coding-benchmarks") ? 200 : 404,
          headers: {
            "content-type": "text/markdown; charset=utf-8",
            "cache-control": "public, max-age=3600, s-maxage=3600",
          },
        }),
    },
  },
});

