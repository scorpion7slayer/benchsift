import { createFileRoute } from "@tanstack/react-router";
import { fetchDeepSweData } from "@/lib/server-fns";
import { DeepSweView } from "@/components/deepswe/deepswe-view";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { absoluteUrl, seo } from "@/lib/seo";

export const Route = createFileRoute("/benchmarks/deepswe")({
  head: () =>
    seo({
      title: "DeepSWE - BenchSift",
      description:
        "DeepSWE benchmark leaderboard from Datacurve: compare coding agents on original long-horizon software engineering tasks.",
      path: "/benchmarks/deepswe",
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "DeepSWE",
        url: absoluteUrl("/benchmarks/deepswe"),
      },
    }),
  loader: async () => fetchDeepSweData(),
  component: DeepSwePage,
});

function DeepSwePage() {
  const data = Route.useLoaderData();
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <DeepSweView data={data} />
      </main>
      <SiteFooter />
    </div>
  );
}
