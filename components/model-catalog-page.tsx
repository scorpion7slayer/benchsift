import {
  Check,
  ChevronLeft,
  ChevronRight,
  LibraryBig,
  Plus,
  SlidersHorizontal,
} from "lucide-react";
import { Link } from "@/components/link";
import { ModelProviderIcon } from "@/components/model-provider-icon-lazy";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCompare } from "@/lib/compare-store";
import { useI18n } from "@/lib/i18n";
import type {
  CatalogModelSummary,
  ModelCatalogPageData,
} from "@/lib/model-catalog";
import { getModelProviderKey } from "@/lib/provider-map";
import { cn } from "@/lib/utils";

function pageHref(page: number): string {
  return page === 1 ? "/models" : `/models/page/${page}`;
}

function paginationItems(page: number, totalPages: number): Array<number | string> {
  const pages = [...new Set([
    1,
    totalPages,
    page - 2,
    page - 1,
    page,
    page + 1,
    page + 2,
  ])]
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((a, b) => a - b);

  const items: Array<number | string> = [];
  pages.forEach((value, index) => {
    const previous = pages[index - 1];
    if (previous && value - previous > 1) items.push(`ellipsis-${previous}`);
    items.push(value);
  });
  return items;
}

function formatScore(value: number | null): string {
  return value === null ? "—" : value.toFixed(1);
}

function formatSpeed(value: number | null): string {
  if (value === null) return "—";
  return `${Math.round(value)} tok/s`;
}

function formatPrice(value: number | null): string {
  if (value === null) return "—";
  if (value === 0) return "$0";
  if (value < 0.01) return `$${value.toFixed(4).replace(/0+$/, "")}`;
  return `$${value.toFixed(2).replace(/\.00$/, "")}`;
}

function CatalogModelRow({ model }: { model: CatalogModelSummary }) {
  const { t } = useI18n();
  const { toggle, isSelected, isFull } = useCompare();
  const selected = isSelected(model.slug);
  const providerKey = getModelProviderKey(model.slug, model.model_creator.slug);

  return (
    <li
      data-selected={selected ? "true" : undefined}
      className="grid min-h-17 grid-cols-[2.5rem_minmax(0,1fr)_2.75rem] items-center gap-3 border-t border-border/70 px-3 py-2.5 transition-colors first:border-t-0 hover:bg-muted/25 data-[selected=true]:bg-chart-1/[0.055] sm:px-4 md:grid-cols-[2.5rem_minmax(0,1fr)_7rem_7rem_7rem_2.75rem]"
    >
      <span className="flex size-10 items-center justify-center rounded-lg bg-muted">
        <ModelProviderIcon
          provider={providerKey}
          size={21}
          iconUrl={model.provider_icon_url}
        />
      </span>

      <Link
        href={`/models/${model.slug}`}
        className="min-w-0 rounded-md py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="flex min-w-0 flex-wrap items-center gap-1.5">
          <span className="truncate text-sm font-medium sm:text-[15px]">{model.name}</span>
          {model.reasoning_model ? (
            <Badge variant="outline" className="hidden h-4.5 px-1.5 text-[10px] sm:inline-flex">
              {t.detail.reasoning}
            </Badge>
          ) : null}
          {model.is_open_weights ? (
            <Badge variant="outline" className="hidden h-4.5 px-1.5 text-[10px] sm:inline-flex">
              {t.detail.openWeights}
            </Badge>
          ) : null}
        </span>
        <span className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground md:hidden">
          <span className="font-mono tabular-nums text-chart-2">
            {formatScore(model.intelligence_score)}
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums">{formatPrice(model.blended_price)}</span>
        </span>
      </Link>

      <span
        aria-label={`${t.card.intelligence}: ${formatScore(model.intelligence_score)}`}
        className="hidden items-center gap-2 font-mono text-sm tabular-nums md:flex"
      >
        <span aria-hidden="true" className="size-2 rounded-full bg-chart-2" />
        {formatScore(model.intelligence_score)}
      </span>
      <span className="hidden font-mono text-sm tabular-nums text-muted-foreground md:block">
        {formatSpeed(model.output_speed)}
      </span>
      <span className="hidden font-mono text-sm tabular-nums text-muted-foreground md:block">
        {formatPrice(model.blended_price)}
      </span>

      <Button
        type="button"
        variant={selected ? "default" : "ghost"}
        size="icon-sm"
        onClick={() => toggle(model.slug)}
        disabled={!selected && isFull}
        aria-pressed={selected}
        aria-label={selected ? t.card.removeCompare : t.card.addCompare}
        title={!selected && isFull ? t.compare.maxReached : selected ? t.card.removeCompare : t.card.addCompare}
        className="touch-target size-11 justify-self-end sm:size-9"
      >
        {selected ? <Check /> : <Plus />}
      </Button>
    </li>
  );
}

export function ModelCatalogPage({
  models,
  page,
  totalModels,
  totalPages,
}: ModelCatalogPageData) {
  const { t } = useI18n();
  const groups = models.reduce<Array<{ provider: string; models: CatalogModelSummary[] }>>(
    (accumulator, model) => {
      const previous = accumulator.at(-1);
      if (previous?.provider === model.model_creator.name) {
        previous.models.push(model);
      } else {
        accumulator.push({ provider: model.model_creator.name, models: [model] });
      }
      return accumulator;
    },
    [],
  );

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-24 pt-7 sm:px-6 sm:pt-9 lg:px-8">
      <header className="flex flex-col gap-5 border-b border-border/70 pb-7 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-chart-1/12 text-chart-1">
            <LibraryBig className="size-5" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{t.catalog.title}</h1>
              <Badge variant="secondary" className="font-mono tabular-nums">
                {t.grid.results(totalModels, totalModels)}
              </Badge>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              {t.catalog.description}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {t.catalog.page(page, totalPages)} · {t.catalog.sortedBy}
            </p>
          </div>
        </div>

        <Button asChild variant="outline" size="sm" className="touch-target shrink-0 self-start">
          <Link href="/">
            <SlidersHorizontal data-icon="inline-start" />
            {t.catalog.explore}
          </Link>
        </Button>
      </header>

      <section aria-label={t.catalog.directoryLabel} className="mt-7 overflow-hidden rounded-xl border border-border/70 bg-card">
        <div className="hidden grid-cols-[2.5rem_minmax(0,1fr)_7rem_7rem_7rem_2.75rem] items-center gap-3 border-b border-border/70 bg-muted/30 px-4 py-2.5 text-xs font-medium text-muted-foreground md:grid">
          <span aria-hidden="true" />
          <span>{t.catalog.model}</span>
          <span>{t.card.intelligence}</span>
          <span>{t.card.speed}</span>
          <span>{t.card.price1m}</span>
          <span className="sr-only">{t.compare.compare}</span>
        </div>

        {groups.map((group) => (
          <section key={group.provider} aria-labelledby={`catalog-provider-${group.models[0].model_creator.slug}`}>
            <div className="flex items-center gap-2 border-y border-border/70 bg-muted/20 px-4 py-2 first:border-t-0">
              <h2
                id={`catalog-provider-${group.models[0].model_creator.slug}`}
                className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground"
              >
                {group.provider}
              </h2>
              <span className="font-mono text-[11px] tabular-nums text-muted-foreground/70">
                {group.models.length}
              </span>
            </div>
            <ul>
              {group.models.map((model) => (
                <CatalogModelRow key={model.id} model={model} />
              ))}
            </ul>
          </section>
        ))}
      </section>

      <nav aria-label={t.catalog.pagination} className="mt-8">
        <div className="flex items-center justify-center gap-3 sm:hidden">
          <Link
            href={page > 1 ? pageHref(page - 1) : pageHref(page)}
            aria-disabled={page <= 1}
            tabIndex={page <= 1 ? -1 : undefined}
            className={cn(
              "touch-target inline-flex size-11 items-center justify-center rounded-md border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              page <= 1 && "pointer-events-none opacity-40",
            )}
            aria-label={t.catalog.previous}
          >
            <ChevronLeft className="size-4" />
          </Link>
          <span className="min-w-28 text-center text-sm font-medium text-muted-foreground">
            {t.catalog.page(page, totalPages)}
          </span>
          <Link
            href={page < totalPages ? pageHref(page + 1) : pageHref(page)}
            aria-disabled={page >= totalPages}
            tabIndex={page >= totalPages ? -1 : undefined}
            className={cn(
              "touch-target inline-flex size-11 items-center justify-center rounded-md border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              page >= totalPages && "pointer-events-none opacity-40",
            )}
            aria-label={t.catalog.next}
          >
            <ChevronRight className="size-4" />
          </Link>
        </div>

        <div className="hidden items-center justify-center gap-1.5 sm:flex">
          <Link
            href={page > 1 ? pageHref(page - 1) : pageHref(page)}
            aria-disabled={page <= 1}
            tabIndex={page <= 1 ? -1 : undefined}
            className={cn(
              "touch-target inline-flex size-11 items-center justify-center rounded-md border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              page <= 1 && "pointer-events-none opacity-40",
            )}
            aria-label={t.catalog.previous}
          >
            <ChevronLeft className="size-4" />
          </Link>

          {paginationItems(page, totalPages).map((item) =>
            typeof item === "number" ? (
              <Link
                key={item}
                href={pageHref(item)}
                aria-current={item === page ? "page" : undefined}
                className={cn(
                  "touch-target inline-flex size-11 items-center justify-center rounded-md border bg-card font-mono text-sm font-medium tabular-nums transition-colors hover:bg-muted",
                  item === page && "border-primary bg-primary text-primary-foreground hover:bg-primary",
                )}
              >
                {item}
              </Link>
            ) : (
              <span key={item} aria-hidden="true" className="inline-flex size-7 items-center justify-center text-muted-foreground">
                …
              </span>
            ),
          )}

          <Link
            href={page < totalPages ? pageHref(page + 1) : pageHref(page)}
            aria-disabled={page >= totalPages}
            tabIndex={page >= totalPages ? -1 : undefined}
            className={cn(
              "touch-target inline-flex size-11 items-center justify-center rounded-md border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              page >= totalPages && "pointer-events-none opacity-40",
            )}
            aria-label={t.catalog.next}
          >
            <ChevronRight className="size-4" />
          </Link>
        </div>
      </nav>
    </main>
  );
}
