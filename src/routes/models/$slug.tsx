import { createFileRoute, notFound } from "@tanstack/react-router";
import { fetchModelDetail, fetchModelCapabilities } from "@/lib/server-fns";
import { ModelDetailClient } from "@/components/model-detail-client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { absoluteUrl, seo } from "@/lib/seo";
import {
  getPrimaryCategory,
  hasAnyBenchmarkData,
  hasMediaBenchmarks,
  hasPricingData,
  isTextOutputModel,
  mediaBenchmarkValues,
  shouldIndexModelPage,
} from "@/lib/model-metrics";

export const Route = createFileRoute("/models/$slug")({
  loader: async ({ params }) => {
    const detail = await fetchModelDetail({ data: params.slug });
    if (!detail) throw notFound();
    // Capabilities scraping starts in parallel — the promise is streamed to
    // the client and consumed there, so it never blocks the initial render.
    const capabilitiesPromise = fetchModelCapabilities({ data: params.slug });
    return { ...detail, capabilitiesPromise };
  },
  head: ({ loaderData }) => {
    const model = loaderData?.model;
    if (!model) return {};
    const category = getPrimaryCategory(model);
    const categoryLabel = category === "unknown" ? "AI" : `${category} AI`;
    const hasBenchmarks = hasAnyBenchmarkData(model);
    const hasPricing = hasPricingData(model);
    const mediaBenchmark = mediaBenchmarkValues(model)[0];
    const description = hasMediaBenchmarks(model) && mediaBenchmark
      ? `${model.name} by ${model.model_creator.name}: ${categoryLabel} model with Artificial Analysis ${mediaBenchmark.label.en}, rank and pricing data when available.`
      : isTextOutputModel(model) && hasBenchmarks
        ? `${model.name} by ${model.model_creator.name}: text model benchmarks, coding and math scores, speed, latency and pricing.`
        : `${model.name} by ${model.model_creator.name}: ${categoryLabel} model details${hasPricing ? ", pricing" : ""}, modalities and source metadata.`;
    const firstUnitPrice = model.pricing.openrouter_display_prices?.[0];
    const offerPrice = model.pricing.price_1m_blended_3_to_1 ?? firstUnitPrice?.price ?? null;
    const offerUnit = model.pricing.price_1m_blended_3_to_1 != null
      ? "1M tokens"
      : firstUnitPrice?.unit || undefined;
    return {
      ...seo({
        title: `${model.name} - BenchSift`,
        description,
        path: `/models/${model.slug}`,
        robots: shouldIndexModelPage(model)
          ? undefined
          : "noindex, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
        jsonLd: {
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: model.name,
          applicationCategory: "AI model",
          operatingSystem: "Cloud",
          url: absoluteUrl(`/models/${model.slug}`),
          creator: {
            "@type": "Organization",
            name: model.model_creator.name,
          },
          datePublished: model.release_date ?? undefined,
          offers:
            offerPrice == null
              ? undefined
              : {
                  "@type": "Offer",
                  price: offerPrice,
                  priceCurrency: "USD",
                  unitText: offerUnit,
                },
        },
      }),
    };
  },
  component: ModelPage,
});

function ModelPage() {
  const { model, familyName, variants, capabilitiesPromise } = Route.useLoaderData();

  return (
    <div className="flex flex-col flex-1">
      <SiteHeader backHref="/" />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <ModelDetailClient
          model={model}
          familyName={familyName}
          variants={variants}
          capabilitiesPromise={capabilitiesPromise}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
