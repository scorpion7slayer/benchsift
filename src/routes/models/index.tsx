import { createFileRoute } from "@tanstack/react-router";
import { ModelCatalogPage } from "@/components/model-catalog-page";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getModelCatalogPage } from "@/lib/model-catalog";
import { absoluteUrl, seo } from "@/lib/seo";
import { fetchModels } from "@/lib/server-fns";

export const Route = createFileRoute("/models/")({
  loader: async () => {
    const models = await fetchModels();
    return getModelCatalogPage(models, 1)!;
  },
  head: () =>
    seo({
      title: "All AI Models - BenchSift",
      description:
        "Browse every indexable AI model on BenchSift, with direct links to benchmarks, pricing, speed and capability details.",
      path: "/models",
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "All AI Models",
        url: absoluteUrl("/models"),
      },
    }),
  component: ModelsIndexPage,
});

function ModelsIndexPage() {
  const catalogPage = Route.useLoaderData();

  return (
    <div className="flex flex-col flex-1">
      <SiteHeader />
      <ModelCatalogPage {...catalogPage} />
      <SiteFooter />
    </div>
  );
}
