import { createFileRoute, notFound } from "@tanstack/react-router";
import { fetchModelBasic, fetchModelCapabilities } from "@/lib/server-fns";
import { ModelDetailClient } from "@/components/model-detail-client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { absoluteUrl, seo } from "@/lib/seo";

export const Route = createFileRoute("/models/$slug")({
  loader: async ({ params }) => {
    const model = await fetchModelBasic({ data: params.slug });
    if (!model) throw notFound();
    // Capabilities scraping starts in parallel — the promise is streamed to
    // the client and consumed there, so it never blocks the initial render.
    const capabilitiesPromise = fetchModelCapabilities({ data: params.slug });
    return { model, capabilitiesPromise };
  },
  head: ({ loaderData }) => {
    const model = loaderData?.model;
    if (!model) return {};
    const description = `${model.name} by ${model.model_creator.name}: AI model benchmarks, coding and math scores, speed, latency and pricing.`;
    return {
      ...seo({
        title: `${model.name} - Nxt AI Card`,
        description,
        path: `/models/${model.slug}`,
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
            model.pricing.price_1m_blended_3_to_1 === null
              ? undefined
              : {
                  "@type": "Offer",
                  price: model.pricing.price_1m_blended_3_to_1,
                  priceCurrency: "USD",
                  unitText: "1M tokens",
                },
        },
      }),
    };
  },
  component: ModelPage,
});

function ModelPage() {
  const { model, capabilitiesPromise } = Route.useLoaderData();

  return (
    <div className="flex flex-col flex-1">
      <SiteHeader backHref="/" />
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
        <ModelDetailClient model={model} capabilitiesPromise={capabilitiesPromise} />
      </main>
      <SiteFooter />
    </div>
  );
}
