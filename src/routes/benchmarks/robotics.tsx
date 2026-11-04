import { useCallback, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { fetchRoboticsData } from "@/lib/server-fns";
import { parseRoboticsSearch, type RoboticsSearch } from "@/lib/aa-robotics-data";
import { RoboticsView } from "@/components/robotics/robotics-view";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { benchmarkHead, ARTIFICIAL_ANALYSIS } from "@/lib/route-seo";
import { roboticsSummary } from "@/lib/benchmark-summaries";
import { DataSummary } from "@/components/data-summary";

export const Route = createFileRoute("/benchmarks/robotics")({
  validateSearch: parseRoboticsSearch,
  // The video state lives in the URL; changing it must not refetch the results.
  shouldReload: ({ cause }) => cause !== "stay",
  head: ({ match, loaderData }) =>
    benchmarkHead({
      lang: match.context.lang,
      key: "robotics",
      path: "/benchmarks/robotics",
      name: "AA-Robotics",
      summary: loaderData ? roboticsSummary(loaderData) : null,
      creator: ARTIFICIAL_ANALYSIS,
      sourceUrl: "https://artificialanalysis.ai/articles/aa-robotics",
      measured: ["AA-Robotics score", "Cost per task (USD)", "Minutes per task"],
    }),
  loader: async () => fetchRoboticsData(),
  component: RoboticsPage,
});

function RoboticsPage() {
  const data = Route.useLoaderData();
  const summary = useMemo(() => roboticsSummary(data), [data]);
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const updateSearch = useCallback(
    (next: RoboticsSearch) => void navigate({ search: next, replace: true, resetScroll: false }),
    [navigate],
  );
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <RoboticsView data={data} summary={<DataSummary data={summary} />} search={search} onSearchChange={updateSearch} />
      </main>
      <SiteFooter />
    </div>
  );
}
