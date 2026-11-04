import { createFileRoute } from "@tanstack/react-router";
import { ModelCatalogPage } from "@/components/model-catalog-page";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { breadcrumbJsonLd, localizedUrl, seo } from "@/lib/seo";
import { translationsFor } from "@/lib/i18n";
import { fetchCatalogPage } from "@/lib/server-fns";

export const Route = createFileRoute("/models/")({
  loader: async () => {
    return (await fetchCatalogPage({ data: 1 }))!;
  },
  head: ({ match, loaderData }) => {
    const lang = match.context.lang;
    const t = translationsFor(lang);
    return seo({
      ...t.seo.pages.models,
      lang,
      path: "/models",
      jsonLd: [breadcrumbJsonLd(lang, [{ name: t.seo.breadcrumb.home, path: "/" }, { name: t.seo.breadcrumb.models, path: "/models" }]), {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: t.seo.pages.models.title.replace(/ - BenchSift$/, ""),
        url: localizedUrl("/models", lang),
        inLanguage: lang,
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: loaderData?.totalModels,
          itemListOrder: "https://schema.org/ItemListOrderAscending",
          itemListElement: loaderData?.models.map((model, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: model.name,
            url: localizedUrl(`/models/${encodeURIComponent(model.slug)}`, lang),
          })),
        },
      }],
    });
  },
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
