import { useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { fetchCyberIndex } from "@/lib/server-fns";
import { parseCyberSearch, type CyberSearch } from "@/lib/cyber-index";
import { CyberIndexView } from "@/components/cyber/cyber-index-view";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { absoluteUrl, seo } from "@/lib/seo";

export const Route = createFileRoute("/benchmarks/cyber")({
  validateSearch: parseCyberSearch,
  // The view state lives in the URL; changing it must not refetch the leaderboard.
  shouldReload: ({ cause }) => cause !== "stay",
  head: () =>
    seo({
      title: "Cyber Index - BenchSift",
      description:
        "Artificial Analysis Cyber Index: compare AI models on cybersecurity tasks, with safety blocks, trusted-access models, benchmark scores and cost per task.",
      path: "/benchmarks/cyber",
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "Cyber Index",
        url: absoluteUrl("/benchmarks/cyber"),
      },
    }),
  loader: async () => fetchCyberIndex(),
  component: CyberIndexPage,
});

function CyberIndexPage() {
  const data = Route.useLoaderData();
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
        <CyberIndexView data={data} search={search} onSearchChange={updateSearch} />
      </main>
      <SiteFooter />
    </div>
  );
}
