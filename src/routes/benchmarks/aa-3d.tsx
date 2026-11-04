import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { fetchAa3dData } from "@/lib/server-fns";
import { Aa3dView } from "@/components/aa3d/aa3d-view";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { benchmarkHead, ARTIFICIAL_ANALYSIS } from "@/lib/route-seo";
import { aa3dSummary } from "@/lib/benchmark-summaries";
import { DataSummary } from "@/components/data-summary";

export const Route = createFileRoute("/benchmarks/aa-3d")({
  head: ({ match, loaderData }) =>
    benchmarkHead({
      lang: match.context.lang,
      key: "aa3d",
      path: "/benchmarks/aa-3d",
      name: "AA-3D",
      summary: loaderData ? aa3dSummary(loaderData) : null,
      creator: ARTIFICIAL_ANALYSIS,
      sourceUrl: "https://artificialanalysis.ai/evaluations/aa-3d",
      measured: ["Elo", "Cost per scene (USD)", "Agent turns per scene"],
    }),
  loader: async () => fetchAa3dData(),
  component: Aa3dPage,
});

function Aa3dPage() {
  const data = Route.useLoaderData();
  const summary = useMemo(() => aa3dSummary(data), [data]);
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <Aa3dView data={data} summary={<DataSummary data={summary} />} />
      </main>
      <SiteFooter />
    </div>
  );
}
