import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { parseCatalogSearch, type CatalogSearch } from "@/lib/catalog-search";
import { fetchHomeCatalog } from "@/lib/server-fns";
import type { HomeCatalogData } from "@/lib/home-catalog";
import { ModelGrid } from "@/components/model-grid";
import { SiteHeader } from "@/components/site-header";
import { HomeHero } from "@/components/home-hero";
import { SiteFooter } from "@/components/site-footer";
import { ScrollToTop } from "@/components/scroll-to-top";
import { SITE_NAME, absoluteUrl, seo, websiteJsonLd } from "@/lib/seo";
import {
  agentDiscoveryLinkHeader,
  homepageMarkdown,
  markdownTokenEstimate,
} from "@/lib/agent-discovery";

export const Route = createFileRoute("/")({
  validateSearch: parseCatalogSearch,
  // Filters live in the URL; changing them must not refetch the whole catalogue.
  shouldReload: ({ cause }) => cause !== "stay",
  server: {
    handlers: {
      GET: ({ request, next }) => {
        const accept = request.headers.get("accept") ?? "";
        if (accept.toLowerCase().includes("text/markdown")) {
          return new Response(homepageMarkdown, {
            headers: {
              "content-type": "text/markdown; charset=utf-8",
              "cache-control":
                "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
              "content-signal": "search=yes, ai-input=yes, ai-train=no",
              "x-markdown-tokens": markdownTokenEstimate(homepageMarkdown),
              Link: agentDiscoveryLinkHeader(),
              Vary: "Accept",
            },
          });
        }

        return next();
      },
    },
  },
  headers: () => ({
    Link: agentDiscoveryLinkHeader(),
    Vary: "Accept",
  }),
  head: ({ loaderData }) =>
    seo({
      title: "BenchSift - AI Model Benchmarks, Pricing and Speed",
      description:
        "Compare AI models by intelligence, coding, math, speed, latency and price. Updated hourly with Artificial Analysis data.",
      path: "/",
      jsonLd: [
        websiteJsonLd(),
        {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: SITE_NAME,
          url: absoluteUrl("/"),
          description:
            "A ranked directory of AI models with benchmarks, performance and pricing.",
          numberOfItems: loaderData?.count,
        },
      ],
    }),
  // The default view renders only the top of the ranking; any other view
  // needs the full list from the first render.
  // (The context is typed loosely: inferring it from the route tree is circular.)
  loader: ({ location }: { location: { search: unknown } }): Promise<HomeCatalogData> =>
    fetchHomeCatalog({ data: { preview: Object.keys(parseCatalogSearch(location.search as Record<string, unknown>)).length === 0 } }),
  component: HomePage,
});

const FULL_CATALOG_TTL_MS = 10 * 60_000;
let fullCatalog: { at: number; request: Promise<HomeCatalogData> } | null = null;

/**
 * Completes a preview with the full ranking once the page has hydrated. The
 * request is shared for the visit, and a failure can be retried.
 */
function useCompleteHomeCatalog(loaded: HomeCatalogData) {
  const [full, setFull] = useState<HomeCatalogData | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const preview = loaded.previewOf !== undefined;

  useEffect(() => {
    if (!preview) return;
    let cancelled = false;
    if (!fullCatalog || Date.now() - fullCatalog.at > FULL_CATALOG_TTL_MS) {
      fullCatalog = { at: Date.now(), request: fetchHomeCatalog({ data: { preview: false } }) };
    }
    const current = fullCatalog;
    current.request.then(
      (data) => { if (!cancelled) { setFull(data); setFailed(false); } },
      () => {
        if (fullCatalog === current) fullCatalog = null;
        if (!cancelled) setFailed(true);
      },
    );
    return () => { cancelled = true; };
  }, [preview, loaded, attempt]);

  const retry = useCallback(() => { setFailed(false); setAttempt((value) => value + 1); }, []);
  const data = preview ? full ?? loaded : loaded;
  return {
    data,
    preview: data.previewOf === undefined ? undefined : { total: data.previewOf, failed, retry },
  };
}

function HomePage() {
  const { data, preview } = useCompleteHomeCatalog(Route.useLoaderData());
  const { count, latestModels, models, cyberModels } = data;
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const updateSearch = useCallback(
    (next: CatalogSearch) => void navigate({ search: next, replace: true, resetScroll: false }),
    [navigate],
  );

  return (
    <div className="flex flex-col flex-1">
      <SiteHeader modelCount={count} />

      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-7xl flex-1 px-4 pb-10 pt-5 sm:px-6 sm:pt-8 lg:px-8">
        <HomeHero
          count={count}
          latestModels={latestModels}
        />
        <ModelGrid models={models} cyberModels={cyberModels} preview={preview} search={search} onSearchChange={updateSearch} />
      </main>

      <SiteFooter />
      <ScrollToTop />
    </div>
  );
}
