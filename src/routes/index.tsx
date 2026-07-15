import { createFileRoute } from "@tanstack/react-router";
import { fetchHomeCatalog } from "@/lib/server-fns";
import { ModelGrid } from "@/components/model-grid";
import { SiteHeader } from "@/components/site-header";
import { HomeHero } from "@/components/home-hero";
import { SiteFooter } from "@/components/site-footer";
import { Separator } from "@/components/ui/separator";
import { ScrollToTop } from "@/components/scroll-to-top";
import { SITE_NAME, absoluteUrl, seo, websiteJsonLd } from "@/lib/seo";
import {
  agentDiscoveryLinkHeader,
  homepageMarkdown,
  markdownTokenEstimate,
} from "@/lib/agent-discovery";

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
          numberOfItems: loaderData?.count,
        },
      ],
    }),
  loader: async () => fetchHomeCatalog(),
  component: HomePage,
});

function HomePage() {
  const { count, latestModels, models } = Route.useLoaderData();

  return (
    <div className="flex flex-col flex-1">
      <SiteHeader modelCount={count} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-24 pt-4 sm:px-6 sm:pt-8 lg:px-8">
        <HomeHero
          count={count}
          latestModels={latestModels}
        />
        <Separator className="mb-6" />
        <ModelGrid models={models} />
      </main>

      <SiteFooter />
      <ScrollToTop />
    </div>
  );
}
