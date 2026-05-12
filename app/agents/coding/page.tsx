import { Suspense } from "react";
import { Loader2, Terminal } from "lucide-react";
import { getCodingAgents } from "@/lib/api";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CodingAgentsTable } from "@/components/coding-agents-table";
import { CodingAgentsPageTitle } from "@/components/coding-agents-page-title";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Coding Agents — Nxt AI Card",
  description: "Artificial Analysis Coding Agent Index: harnesses (Claude Code, Cursor CLI, OpenCode…) on SWE-Bench-Pro-Hard-AA, Terminal-Bench v2 and SWE-Atlas-QnA.",
};

async function AgentsContent() {
  const agents = await getCodingAgents();
  return <CodingAgentsTable agents={agents} />;
}

function AgentsLoading() {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-4 text-muted-foreground">
      <Loader2 className="size-8 animate-spin" />
    </div>
  );
}

export default function CodingAgentsPage() {
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
        <Suspense fallback={<AgentsLoading />}>
          <AgentsContent />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}
