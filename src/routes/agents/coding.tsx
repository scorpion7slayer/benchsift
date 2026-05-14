import { createFileRoute } from "@tanstack/react-router";
import { Terminal } from "lucide-react";
import { fetchCodingAgents } from "@/lib/server-fns";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CodingAgentsTable } from "@/components/coding-agents-table";
import { CodingAgentsPageTitle } from "@/components/coding-agents-page-title";

export const Route = createFileRoute("/agents/coding")({
  head: () => ({
    meta: [
      { title: "Coding Agents — Nxt AI Card" },
      {
        name: "description",
        content:
          "Artificial Analysis Coding Agent Index: harnesses (Claude Code, Cursor CLI, OpenCode…) on SWE-Bench-Pro-Hard-AA, Terminal-Bench v2 and SWE-Atlas-QnA.",
      },
    ],
  }),
  loader: async () => fetchCodingAgents(),
  component: CodingAgentsPage,
});

function CodingAgentsPage() {
  const agents = Route.useLoaderData();

  return (
    <div className="flex flex-col flex-1">
      <SiteHeader />
      <main className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-start gap-3">
          <div className="size-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <Terminal className="size-5 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <CodingAgentsPageTitle />
          </div>
        </div>
        <CodingAgentsTable agents={agents} />
      </main>
      <SiteFooter />
    </div>
  );
}
