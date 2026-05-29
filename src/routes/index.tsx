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

function getLatestModelSummary(models: LLMModel[]): LatestModelSummary | null {
  const latest = models.reduce<LLMModel | null>((current, model) => {
    if (!model.release_date) return current;
    if (!current?.release_date) return model;
    return model.release_date > current.release_date ? model : current;
  }, null);

  if (!latest) return null;

  return {
    slug: latest.slug,
    name: latest.name,
    providerName: latest.model_creator.name,
    providerSlug: latest.model_creator.slug,
    releaseDate: latest.release_date,
  };
}

export const Route = createFileRoute("/")({
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
  const latestModel = getLatestModelSummary(models);
  const compareModels = models.map((model) => ({
    slug: model.slug,
    name: model.name,
    providerName: model.model_creator.name,
    providerSlug: model.model_creator.slug,
  }));

  return (
    <div className="flex flex-col flex-1">
      <SiteHeader modelCount={models.length} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        <HomeHero
          count={models.length}
          latestModel={latestModel}
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
