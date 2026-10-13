import { createFileRoute } from "@tanstack/react-router";
import { fetchFrontierCodeData } from "@/lib/server-fns";
import { FrontierCodeView } from "@/components/frontiercode/frontiercode-view";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { absoluteUrl, seo } from "@/lib/seo";

export const Route = createFileRoute("/benchmarks/frontiercode")({
  head: () =>
    seo({
      title: "FrontierCode - BenchSift",
      description:
        "FrontierCode benchmark leaderboard from Artificial Analysis: compare how often models produce changes a maintainer would merge on real open-source repositories.",
      path: "/benchmarks/frontiercode",
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "FrontierCode",
        url: absoluteUrl("/benchmarks/frontiercode"),
      },
    }),
  loader: async () => fetchFrontierCodeData(),
  component: FrontierCodePage,
});

function FrontierCodePage() {
  const data = Route.useLoaderData();
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <FrontierCodeView data={data} />
      </main>
      <SiteFooter />
    </div>
  );
}
