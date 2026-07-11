import { createFileRoute } from "@tanstack/react-router";
import { fetchCompareData } from "@/lib/server-fns";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CompareTable } from "@/components/compare-table";
import { GitCompareArrows } from "lucide-react";
import { absoluteUrl, seo } from "@/lib/seo";
import { useI18n } from "@/lib/i18n";

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
  pendingMs: 200,
  pendingMinMs: 200,
  pendingComponent: ComparePending,
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

function ComparePending() {
  const { t } = useI18n();

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div
          role="status"
          aria-live="polite"
          className="flex flex-col items-center gap-3 text-center text-muted-foreground"
        >
          <GitCompareArrows className="size-10 motion-safe:animate-pulse" />
          <p className="text-sm">{t.compare.loading}</p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

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
