import { createFileRoute } from "@tanstack/react-router";
import { fetchCompareData } from "@/lib/server-fns";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CompareTable } from "@/components/compare-table";
import { absoluteUrl, seo } from "@/lib/seo";

interface CompareSearch {
  models?: string;
}

export const Route = createFileRoute("/compare")({
  validateSearch: (search: Record<string, unknown>): CompareSearch => ({
    models: typeof search.models === "string" ? search.models : undefined,
  }),
  loaderDeps: ({ search }) => ({ models: search.models }),
  loader: async ({ deps }) => {
    const slugs = [...new Set((deps.models ?? "").split(",").filter(Boolean))].slice(0, 4);
    return fetchCompareData({ data: slugs });
  },
  head: () =>
    seo({
      title: "AI Model Compare - BenchSift",
      description:
        "Compare AI models side by side across benchmarks, pricing, latency, throughput, context window and capabilities.",
      path: "/compare",
      robots: "noindex, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "AI Model Compare",
        url: absoluteUrl("/compare"),
      },
    }),
  component: ComparePage,
});

function ComparePage() {
  const { allModels, selected } = Route.useLoaderData();

  return (
    <div className="flex flex-col flex-1">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 pb-20 sm:px-6 sm:py-8 lg:px-8">
        <CompareTable models={selected} allModels={allModels} />
      </main>
      <SiteFooter />
    </div>
  );
}
