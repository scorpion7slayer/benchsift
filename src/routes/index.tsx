import { createFileRoute } from "@tanstack/react-router";
import { fetchModels } from "@/lib/server-fns";
import { type LLMModel } from "@/lib/api";
import { ModelGrid } from "@/components/model-grid";
import { SiteHeader } from "@/components/site-header";
import { HomeHero, type LatestModelSummary } from "@/components/home-hero";
import { SiteFooter } from "@/components/site-footer";
import { Separator } from "@/components/ui/separator";
import { ScrollToTop } from "@/components/scroll-to-top";
import { SITE_NAME, absoluteUrl, seo, websiteJsonLd } from "@/lib/seo";
import {
  agentDiscoveryLinkHeader,
  homepageMarkdown,
  markdownTokenEstimate,
} from "@/lib/agent-discovery";
import { modelReleaseTime } from "@/lib/model-release";

function getLatestModelSummaries(models: LLMModel[], limit = 3): LatestModelSummary[] {
  return models
    .map((model, index) => ({ model, index, time: modelReleaseTime(model) }))
    .filter((entry) => Number.isFinite(entry.time))
    .sort((a, b) => b.time - a.time || a.index - b.index)
    .slice(0, limit)
    .map(({ model }) => ({
      slug: model.slug,
      name: model.name,
      providerName: model.model_creator.name,
      providerSlug: model.model_creator.slug,
      providerIconUrl: model.provider_icon_url,
      releaseDate: model.release_date,
      releaseTimestamp: model.release_timestamp ?? null,
    }));
}

export const Route = createFileRoute("/")({
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
          numberOfItems: loaderData?.length,
        },
      ],
    }),
  loader: async () => fetchModels(),
  component: HomePage,
});

function HomePage() {
  const models = Route.useLoaderData();
  const latestModels = getLatestModelSummaries(models);
  const compareModels = models.map((model) => ({
    slug: model.slug,
    name: model.name,
    providerName: model.model_creator.name,
    providerSlug: model.model_creator.slug,
    providerIconUrl: model.provider_icon_url,
  }));

  return (
    <div className="flex flex-col flex-1">
      <SiteHeader modelCount={models.length} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        <HomeHero
          count={models.length}
          latestModels={latestModels}
          compareModels={compareModels}
        />
        <Separator className="mb-6" />
        <ModelGrid models={models} />
      </main>

      <SiteFooter />
      <ScrollToTop />
    </div>
  );
}
