import { createFileRoute } from "@tanstack/react-router";
import { Terminal } from "lucide-react";
import { fetchCodingAgents } from "@/lib/server-fns";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CodingAgentsTable } from "@/components/coding-agents-table";
import { CodingAgentsPageTitle } from "@/components/coding-agents-page-title";
import { absoluteUrl, seo } from "@/lib/seo";

export const Route = createFileRoute("/agents/coding")({
  head: () =>
    seo({
      title: "Coding Agents - BenchSift",
      description:
        "Artificial Analysis Coding Agent Index: compare Claude Code, Cursor CLI, OpenCode and other harnesses on SWE-Bench-Pro-Hard-AA, Terminal-Bench v2 and SWE-Atlas-QnA.",
      path: "/agents/coding",
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "Coding Agents",
        url: absoluteUrl("/agents/coding"),
      },
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
