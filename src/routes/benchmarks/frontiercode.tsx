import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { fetchFrontierCodeData } from "@/lib/server-fns";
import { FrontierCodeView } from "@/components/frontiercode/frontiercode-view";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { benchmarkHead, ARTIFICIAL_ANALYSIS } from "@/lib/route-seo";
import { frontierCodeSummary } from "@/lib/benchmark-summaries";
import { DataSummary } from "@/components/data-summary";

export const Route = createFileRoute("/benchmarks/frontiercode")({
  head: ({ match, loaderData }) =>
    benchmarkHead({
      lang: match.context.lang,
      key: "frontiercode",
      path: "/benchmarks/frontiercode",
      name: "FrontierCode",
      summary: loaderData ? frontierCodeSummary(loaderData) : null,
      creator: ARTIFICIAL_ANALYSIS,
      sourceUrl: "https://artificialanalysis.ai/evaluations/frontiercode-2-0",
      measured: ["FrontierCode score", "Cost per task (USD)", "Time per task (s)", "Output tokens per task"],
    }),
  loader: async () => fetchFrontierCodeData(),
  component: FrontierCodePage,
});

function FrontierCodePage() {
  const data = Route.useLoaderData();
  const summary = useMemo(() => frontierCodeSummary(data), [data]);
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <FrontierCodeView data={data} summary={<DataSummary data={summary} />} />
      </main>
      <SiteFooter />
    </div>
  );
}
