import { createFileRoute, notFound } from "@tanstack/react-router";
import { ModelCatalogPage } from "@/components/model-catalog-page";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getModelCatalogPage } from "@/lib/model-catalog";
import { absoluteUrl, seo } from "@/lib/seo";
import { fetchModels } from "@/lib/server-fns";

export const Route = createFileRoute("/models/page/$page")({
  loader: async ({ params }) => {
    const page = Number(params.page);
    if (!Number.isSafeInteger(page) || page <= 1) throw notFound();

    const models = await fetchModels();
    const catalogPage = getModelCatalogPage(models, page);
    if (!catalogPage) throw notFound();
    return catalogPage;
  },
  head: ({ loaderData }) => {
    const page = loaderData?.page;
    if (!page) return {};

    return seo({
      title: `All AI Models - Page ${page} - BenchSift`,
      description: `Browse AI models on BenchSift, page ${page}, with direct links to benchmarks, pricing, speed and capability details.`,
      path: `/models/page/${page}`,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: `All AI Models - Page ${page}`,
        url: absoluteUrl(`/models/page/${page}`),
      },
    });
  },
  component: ModelsCatalogPage,
});

function ModelsCatalogPage() {
  const catalogPage = Route.useLoaderData();

  return (
    <div className="flex flex-col flex-1">
      <SiteHeader />
      <ModelCatalogPage {...catalogPage} />
      <SiteFooter />
    </div>
  );
}
