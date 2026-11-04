import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { fetchDeepSweData } from "@/lib/server-fns";
import { DeepSweView } from "@/components/deepswe/deepswe-view";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { benchmarkHead } from "@/lib/route-seo";
import { deepSweSummary } from "@/lib/benchmark-summaries";
import { DataSummary } from "@/components/data-summary";

export const Route = createFileRoute("/benchmarks/deepswe")({
  head: ({ match, loaderData }) =>
    benchmarkHead({
      lang: match.context.lang,
      key: "deepswe",
      path: "/benchmarks/deepswe",
      name: "DeepSWE",
      summary: loaderData ? deepSweSummary(loaderData) : null,
      creator: { name: "Datacurve", url: "https://datacurve.ai" },
      sourceUrl: "https://deepswe.datacurve.ai/",
      measured: ["pass@1", "pass@4", "Cost per task (USD)", "Duration per task (s)"],
    }),
  loader: async () => fetchDeepSweData(),
  component: DeepSwePage,
});

function DeepSwePage() {
  const data = Route.useLoaderData();
  const summary = useMemo(() => deepSweSummary(data), [data]);
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <DeepSweView data={data} summary={<DataSummary data={summary} />} />
      </main>
      <SiteFooter />
    </div>
  );
}
