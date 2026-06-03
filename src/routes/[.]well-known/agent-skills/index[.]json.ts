import { createHash } from "node:crypto";
import { createFileRoute } from "@tanstack/react-router";
import { absoluteUrl } from "@/lib/seo";
import { agentSkills } from "@/lib/agent-discovery";

function sha256Hex(content: string): string {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

export const Route = createFileRoute("/.well-known/agent-skills/index.json")({
  server: {
    handlers: {
      GET: () =>
        Response.json(
          {
            $schema: "https://agentskills.io/schemas/agent-skills-index-v0.2.json",
            skills: agentSkills.map((skill) => ({
              name: skill.name,
              type: skill.type,
              description: skill.description,
              url: absoluteUrl(`/.well-known/agent-skills/${skill.slug}.md`),
              sha256: sha256Hex(skill.content),
            })),
          },
          {
            headers: {
              "content-type": "application/json; charset=utf-8",
              "cache-control": "public, max-age=3600, s-maxage=3600",
            },
          },
        ),
    },
  },
});

