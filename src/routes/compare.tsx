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
    const slugs = (deps.models ?? "").split(",").filter(Boolean).slice(0, 4);
    return fetchCompareData({ data: slugs });
  },
  head: () =>
    seo({
      title: "AI Model Compare - BenchSift",
      description:
        "Compare AI models side by side across benchmarks, pricing, latency, throughput, context window and capabilities.",
      path: "/compare",
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
      <main className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CompareTable models={selected} allModels={allModels} />
      </main>
      <SiteFooter />
    </div>
  );
}
