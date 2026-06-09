import { LibraryBig } from "lucide-react";
import { Link } from "@/components/link";
import { ModelCard } from "@/components/model-card";
import { useI18n } from "@/lib/i18n";
import type { ModelCatalogPageData } from "@/lib/model-catalog";

function pageHref(page: number): string {
  return page === 1 ? "/models" : `/models/page/${page}`;
}

export function ModelCatalogPage({
  models,
  page,
  totalModels,
  totalPages,
}: ModelCatalogPageData) {
  const { t } = useI18n();

  return (
    <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
      <div className="mb-8 flex items-start gap-3">
        <div className="size-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
          <LibraryBig className="size-5 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t.catalog.title}
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            {t.catalog.description}
          </p>
          <p className="text-xs text-muted-foreground">
            {t.catalog.page(page, totalPages)} · {t.grid.results(totalModels, totalModels)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {models.map((model) => (
          <ModelCard key={model.id} model={model} />
        ))}
      </div>

      <nav
        aria-label={t.catalog.pagination}
        className="mt-10 flex flex-wrap items-center justify-center gap-2"
      >
        {page > 1 ? (
          <Link
            href={pageHref(page - 1)}
            className="rounded-md border bg-card px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            {t.catalog.previous}
          </Link>
        ) : null}

        {Array.from({ length: totalPages }, (_, index) => index + 1).map(
          (pageNumber) => (
            <Link
              key={pageNumber}
              href={pageHref(pageNumber)}
              aria-current={pageNumber === page ? "page" : undefined}
              className={
                pageNumber === page
                  ? "flex size-9 items-center justify-center rounded-md bg-primary text-sm font-medium text-primary-foreground"
                  : "flex size-9 items-center justify-center rounded-md border bg-card text-sm font-medium transition-colors hover:bg-muted"
              }
            >
              {pageNumber}
            </Link>
          ),
        )}

        {page < totalPages ? (
          <Link
            href={pageHref(page + 1)}
            className="rounded-md border bg-card px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            {t.catalog.next}
          </Link>
        ) : null}
      </nav>
    </main>
  );
}
