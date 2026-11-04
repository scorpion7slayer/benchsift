import { createFileRoute } from "@tanstack/react-router";
import { fetchCodingAgents } from "@/lib/server-fns";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CodingAgentsView } from "@/components/coding-agents/coding-agents-view";
import { localizedUrl } from "@/lib/seo";
import { pageHead } from "@/lib/route-seo";

export const Route = createFileRoute("/agents/coding")({
  head: ({ match }) =>
    pageHead(match.context.lang, "agentsCoding", "/agents/coding", {
      jsonLd: [{
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "Coding Agents",
        url: localizedUrl("/agents/coding", match.context.lang),
        inLanguage: match.context.lang,
      }],
    }),
  loader: async () => fetchCodingAgents(),
  component: CodingAgentsPage,
});

function CodingAgentsPage() {
  const agents = Route.useLoaderData();
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <CodingAgentsView agents={agents} />
      </main>
      <SiteFooter />
    </div>
  );
}
