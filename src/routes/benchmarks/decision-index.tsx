import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { fetchDecisionIndexData } from "@/lib/server-fns";
import { DecisionIndexView } from "@/components/decision-index/decision-index-view";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { benchmarkHead, ARTIFICIAL_ANALYSIS } from "@/lib/route-seo";
import { decisionIndexSummary } from "@/lib/benchmark-summaries";
import { DataSummary } from "@/components/data-summary";

export const Route = createFileRoute("/benchmarks/decision-index")({
  head: ({ match, loaderData }) =>
    benchmarkHead({
      lang: match.context.lang,
      key: "decisionIndex",
      path: "/benchmarks/decision-index",
      name: "Decision Index",
      summary: loaderData ? decisionIndexSummary(loaderData) : null,
      creator: ARTIFICIAL_ANALYSIS,
      sourceUrl: "https://artificialanalysis.ai/evaluations/artificial-analysis-decision-index",
      measured: ["Decision Index", "Cost per task (USD)", "Time per task (s)"],
    }),
  loader: async () => fetchDecisionIndexData(),
  component: DecisionIndexPage,
});

function DecisionIndexPage() {
  const data = Route.useLoaderData();
  const summary = useMemo(() => decisionIndexSummary(data), [data]);
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <DecisionIndexView data={data} summary={<DataSummary data={summary} />} />
      </main>
      <SiteFooter />
    </div>
  );
}
