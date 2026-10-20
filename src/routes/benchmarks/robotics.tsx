import { useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { fetchRoboticsData } from "@/lib/server-fns";
import { parseRoboticsSearch, type RoboticsSearch } from "@/lib/aa-robotics-data";
import { RoboticsView } from "@/components/robotics/robotics-view";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { absoluteUrl, seo } from "@/lib/seo";

export const Route = createFileRoute("/benchmarks/robotics")({
  validateSearch: parseRoboticsSearch,
  // The video state lives in the URL; changing it must not refetch the results.
  shouldReload: ({ cause }) => cause !== "stay",
  head: () =>
    seo({
      title: "AA-Robotics - BenchSift",
      description:
        "AA-Robotics results from Artificial Analysis: compare how language models score, what they cost and how long they take when they control a robot arm on tabletop tasks.",
      path: "/benchmarks/robotics",
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "AA-Robotics",
        url: absoluteUrl("/benchmarks/robotics"),
      },
    }),
  loader: async () => fetchRoboticsData(),
  component: RoboticsPage,
});

function RoboticsPage() {
  const data = Route.useLoaderData();
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
        <RoboticsView data={data} search={search} onSearchChange={updateSearch} />
      </main>
      <SiteFooter />
    </div>
  );
}
