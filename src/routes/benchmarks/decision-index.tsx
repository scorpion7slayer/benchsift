import { createFileRoute } from "@tanstack/react-router";
import { fetchDecisionIndexData } from "@/lib/server-fns";
import { DecisionIndexView } from "@/components/decision-index/decision-index-view";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { absoluteUrl, seo } from "@/lib/seo";

export const Route = createFileRoute("/benchmarks/decision-index")({
  head: () =>
    seo({
      title: "Decision Index - BenchSift",
      description:
        "Artificial Analysis Decision Index leaderboard: compare decision models and language models on classification, tool calling, knowledge, hallucination and reasoning, with cost and time per task.",
      path: "/benchmarks/decision-index",
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "Artificial Analysis Decision Index",
        url: absoluteUrl("/benchmarks/decision-index"),
      },
    }),
  loader: async () => fetchDecisionIndexData(),
  component: DecisionIndexPage,
});

function DecisionIndexPage() {
  const data = Route.useLoaderData();
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <DecisionIndexView data={data} />
      </main>
      <SiteFooter />
    </div>
  );
}
