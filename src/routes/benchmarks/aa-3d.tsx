import { createFileRoute } from "@tanstack/react-router";
import { fetchAa3dData } from "@/lib/server-fns";
import { Aa3dView } from "@/components/aa3d/aa3d-view";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { absoluteUrl, seo } from "@/lib/seo";

export const Route = createFileRoute("/benchmarks/aa-3d")({
  head: () =>
    seo({
      title: "AA-3D - BenchSift",
      description:
        "AA-3D benchmark leaderboard from Artificial Analysis: compare how well models build interactive three.js scenes, ranked by Elo from blind pairwise votes.",
      path: "/benchmarks/aa-3d",
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "AA-3D",
        url: absoluteUrl("/benchmarks/aa-3d"),
      },
    }),
  loader: async () => fetchAa3dData(),
  component: Aa3dPage,
});

function Aa3dPage() {
  const data = Route.useLoaderData();
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <Aa3dView data={data} />
      </main>
      <SiteFooter />
    </div>
  );
}
