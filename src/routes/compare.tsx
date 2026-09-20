import { createFileRoute } from "@tanstack/react-router";
import { fetchCompareData } from "@/lib/server-fns";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CompareTable } from "@/components/compare-table";
import { ChevronLeft, GitCompareArrows } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/link";
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
    const slugs = [
      ...new Set((deps.models ?? "").split(",").filter(Boolean)),
    ].slice(0, 4);
    return fetchCompareData({ data: slugs });
  },
  pendingMs: 200,
  pendingMinMs: 0,
  pendingComponent: ComparePending,
  head: () =>
    seo({
      title: "AI Model Compare - BenchSift",
      description:
        "Compare AI models side by side across benchmarks, pricing, latency, throughput, context window and capabilities.",
      path: "/compare",
      robots:
        "noindex, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
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
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 pb-20 sm:px-6 sm:py-8 lg:px-8"
      >
        <section className="flex flex-col gap-4 border-b border-border/70 pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-card text-muted-foreground">
              <GitCompareArrows className="size-5" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">
                  {t.compare.title}
                </h1>
                <Badge variant="secondary">{t.compare.selectedCount(0)}</Badge>
              </div>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                {t.compare.description}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            asChild
            className="touch-target shrink-0 self-start"
          >
            <Link href="/" aria-label={t.compare.backToList}>
              <ChevronLeft data-icon="inline-start" />
              <span className="hidden sm:inline">{t.compare.backToList}</span>
            </Link>
          </Button>
        </section>

        <section
          role="status"
          aria-live="polite"
          className="rounded-xl border bg-card p-5"
        >
          <p className="text-sm text-muted-foreground">{t.compare.loading}</p>
          <div
            aria-hidden="true"
            className="mt-4 grid grid-cols-2 gap-3 motion-safe:animate-pulse lg:grid-cols-4"
          >
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="h-24 rounded-lg bg-muted" />
            ))}
          </div>
          <div
            aria-hidden="true"
            className="mt-4 h-11 rounded-lg bg-muted motion-safe:animate-pulse"
          />
        </section>
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
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 pb-20 sm:px-6 sm:py-8 lg:px-8"
      >
        <CompareTable models={selected} allModels={allModels} />
      </main>
      <SiteFooter />
    </div>
  );
}
