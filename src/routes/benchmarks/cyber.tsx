import { useCallback, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { fetchCyberIndex } from "@/lib/server-fns";
import { parseCyberSearch, type CyberSearch } from "@/lib/cyber-index";
import { CyberIndexView } from "@/components/cyber/cyber-index-view";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { benchmarkHead, ARTIFICIAL_ANALYSIS } from "@/lib/route-seo";
import { cyberSummary } from "@/lib/benchmark-summaries";
import { DataSummary } from "@/components/data-summary";

export const Route = createFileRoute("/benchmarks/cyber")({
  validateSearch: parseCyberSearch,
  // The view state lives in the URL; changing it must not refetch the leaderboard.
  shouldReload: ({ cause }) => cause !== "stay",
  head: ({ match, loaderData }) =>
    benchmarkHead({
      lang: match.context.lang,
      key: "cyber",
      path: "/benchmarks/cyber",
      name: "Cyber Index",
      summary: loaderData ? cyberSummary(loaderData) : null,
      creator: ARTIFICIAL_ANALYSIS,
      sourceUrl: "https://artificialanalysis.ai/#cyber-index",
      measured: ["Cyber Index", "Safety block rate", "Cost per task (USD)"],
    }),
  loader: async () => fetchCyberIndex(),
  component: CyberIndexPage,
});

function CyberIndexPage() {
  const data = Route.useLoaderData();
  const summary = useMemo(() => cyberSummary(data), [data]);
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const updateSearch = useCallback(
    (next: CyberSearch) => void navigate({ search: next, replace: true, resetScroll: false }),
    [navigate],
  );
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <CyberIndexView data={data} summary={<DataSummary data={summary} />} search={search} onSearchChange={updateSearch} />
      </main>
      <SiteFooter />
    </div>
  );
}
