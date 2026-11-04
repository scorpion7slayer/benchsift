import { createFileRoute, notFound } from "@tanstack/react-router";
import { ModelCatalogPage } from "@/components/model-catalog-page";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { MODEL_CATALOG_PAGE_SIZE } from "@/lib/model-catalog";
import { breadcrumbJsonLd, localizedUrl, seo } from "@/lib/seo";
import { translationsFor } from "@/lib/i18n";
import { fetchCatalogPage } from "@/lib/server-fns";

export const Route = createFileRoute("/models/page/$page")({
  loader: async ({ params }) => {
    const page = Number(params.page);
    if (!Number.isSafeInteger(page) || page <= 1) throw notFound();

    const catalogPage = await fetchCatalogPage({ data: page });
    if (!catalogPage) throw notFound();
    return catalogPage;
  },
  head: ({ match, loaderData }) => {
    const page = loaderData?.page;
    if (!page) return {};
    const lang = match.context.lang;
    const t = translationsFor(lang);
    const copy = t.seo.modelsPage(page);

    return seo({
      ...copy,
      lang,
      path: `/models/page/${page}`,
      jsonLd: [breadcrumbJsonLd(lang, [
        { name: t.seo.breadcrumb.home, path: "/" },
        { name: t.seo.breadcrumb.models, path: "/models" },
        { name: copy.title.replace(/ - BenchSift$/, ""), path: `/models/page/${page}` },
      ]), {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: copy.title.replace(/ - BenchSift$/, ""),
        url: localizedUrl(`/models/page/${page}`, lang),
        inLanguage: lang,
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: loaderData?.totalModels,
          itemListOrder: "https://schema.org/ItemListOrderAscending",
          itemListElement: loaderData?.models.map((model, index) => ({
            "@type": "ListItem",
            position: (page - 1) * MODEL_CATALOG_PAGE_SIZE + index + 1,
            name: model.name,
            url: localizedUrl(`/models/${encodeURIComponent(model.slug)}`, lang),
          })),
        },
      }],
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
