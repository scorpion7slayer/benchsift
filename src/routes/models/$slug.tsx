import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { fetchModelDetail, fetchModelCapabilities, fetchModelDecisionIndex } from "@/lib/server-fns";
import { ModelDetailClient } from "@/components/model-detail-client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { breadcrumbJsonLd, localizedUrl, seo } from "@/lib/seo";
import { translationsFor } from "@/lib/i18n";
import {
  getPrimaryCategory,
  hasAnyBenchmarkData,
  hasMediaBenchmarks,
  hasPricingData,
  isTextOutputModel,
  mediaBenchmarkValues,
  shouldIndexModelPage,
} from "@/lib/model-metrics";
import { canonicalVariantSlug } from "@/lib/model-reasoning";

export const Route = createFileRoute("/models/$slug")({
  loader: async ({ params }) => {
    const detail = await fetchModelDetail({ data: params.slug });
    if (!detail) throw notFound();
    // Aliases and other spellings of the slug move to the model's own address.
    const otherCase = params.slug !== detail.model.slug && params.slug.toLowerCase() === detail.model.slug.toLowerCase();
    if (otherCase || detail.model.alias_slugs?.includes(params.slug)) throw redirect({
      to: "/models/$slug", params: { slug: detail.model.slug }, statusCode: 301,
    });
    // Capabilities scraping starts in parallel — the promise is streamed to
    // the client and consumed there, so it never blocks the initial render.
    const capabilitiesPromise = fetchModelCapabilities({ data: params.slug });
    // Streamed the same way: the Decision Index comes from a separate AA page.
    const decisionIndexPromise = fetchModelDecisionIndex({ data: detail.model.slug });
    return { ...detail, capabilitiesPromise, decisionIndexPromise };
  },
  head: ({ match, loaderData }) => {
    const model = loaderData?.model;
    if (!model) return {};
    const lang = match.context.lang;
    const t = translationsFor(lang);
    const category = getPrimaryCategory(model);
    const categoryLabel = t.seo.model.categories[category];
    const hasBenchmarks = hasAnyBenchmarkData(model);
    const hasPricing = hasPricingData(model);
    const mediaBenchmark = mediaBenchmarkValues(model)[0];
    const creator = model.model_creator.name;
    const description = hasMediaBenchmarks(model) && mediaBenchmark
      ? t.seo.model.media(model.name, creator, categoryLabel, mediaBenchmark.label[lang])
      : isTextOutputModel(model) && hasBenchmarks
        ? t.seo.model.text(model.name, creator)
        : t.seo.model.other(model.name, creator, categoryLabel, hasPricing);
    const pageUrl = localizedUrl(`/models/${model.slug}`, lang);
    const firstUnitPrice = model.pricing.openrouter_display_prices?.[0];
    const offerPrice = model.pricing.price_1m_blended_3_to_1 ?? firstUnitPrice?.price ?? null;
    const offerUnit = model.pricing.price_1m_blended_3_to_1 != null
      ? "1M tokens"
      : firstUnitPrice?.unit || undefined;
    return {
      ...seo({
        title: `${model.name} - BenchSift`,
        description,
        lang,
        path: `/models/${model.slug}`,
        // One indexed page per family: the variant the catalogue and sitemap list.
        robots: shouldIndexModelPage(model) &&
          (loaderData.variants.length <= 1 || canonicalVariantSlug(loaderData.variants.map((variant) => variant.slug)) === model.slug)
          ? undefined
          : "noindex, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
        jsonLd: [breadcrumbJsonLd(lang, [
          { name: t.seo.breadcrumb.home, path: "/" },
          { name: model.model_creator.name, path: `/?provider=${encodeURIComponent(model.model_creator.slug)}` },
          { name: model.name, path: `/models/${model.slug}` },
        ]), {
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: model.name,
          applicationCategory: "AI model",
          operatingSystem: "Cloud",
          url: pageUrl,
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
        }],
      }),
    };
  },
  component: ModelPage,
});

function ModelPage() {
  const { model, familyName, variants, familyPoints, ranks, similar, cyberCounterparts, capabilitiesPromise, decisionIndexPromise } = Route.useLoaderData();

  return (
    <div className="flex flex-col flex-1 pb-24 sm:pb-0">
      <SiteHeader backHref="/" />
      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <ModelDetailClient
          model={model}
          familyName={familyName}
          variants={variants}
          insights={{ familyPoints, ranks, similar, cyberCounterparts }}
          capabilitiesPromise={capabilitiesPromise}
          decisionIndexPromise={decisionIndexPromise}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
