import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CatalogSelect } from "@/components/catalog-select";
import { CompareModelSearch } from "@/components/compare-model-search";
import { GitCompareArrows, Link2, Check } from "@/components/icons";
import { ModelProviderIcon } from "@/components/model-provider-icon";
import { SegmentedControl } from "@/components/segmented-control";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { LLMModel } from "@/lib/model-types";
import type { CompareModelOption } from "@/lib/compare-model";
import type { ComparisonFamily } from "@/lib/model-insights";
import { useCompare } from "@/lib/compare-store";
import { buildComparisonRows } from "@/lib/comparison-rows";
import { useI18n } from "@/lib/i18n";
import { getModelProviderKey } from "@/lib/provider-map";
import { ComparedModel } from "./compared-model";
import { ComparisonMatrix } from "./comparison-matrix";
import { ComparisonStack } from "./comparison-stack";
import { ComparisonTradeoff } from "./comparison-tradeoff";
import { visibleSections, type ComparisonView } from "./row-sections";
import { useComparisonModels } from "./use-comparison-models";
import { PageCat } from "@/components/pixel-art/page-cats";

export const MAX_COMPARED_MODELS = 4;
const FRESH_COLUMN_MS = 700;

export function CompareWorkspace({
  models: baseModels,
  allModels,
  families,
}: {
  models: LLMModel[];
  allModels: CompareModelOption[];
  families: Record<string, ComparisonFamily>;
}) {
  const { t, lang } = useI18n();
  const copy = t.compareWorkspace;
  const models = useComparisonModels(baseModels);
  const navigate = useNavigate({ from: "/compare" });
  const { replace } = useCompare();
  const [pending, startTransition] = useTransition();
  const [view, setView] = useState<ComparisonView>("essential");
  const [differencesOnly, setDifferencesOnly] = useState(false);
  const [shareState, setShareState] = useState<"idle" | "copied" | { url: string }>("idle");
  const [failed, setFailed] = useState(false);
  const [leaving, setLeaving] = useState<string | null>(null);
  const [fresh, setFresh] = useState<string | null>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const restoreFocus = useRef(false);
  const requested = useRef(models.map((model) => model.slug));
  const navigating = useRef(false);

  const signature = baseModels.map((model) => model.slug).join(",");
  useEffect(() => {
    requested.current = signature ? signature.split(",") : [];
    replace(requested.current);
    setLeaving(null);
    setShareState("idle");
  }, [signature, replace]);

  // After adding or removing, keyboard focus returns to the visible search field
  // (mobile and desktop each render one), or to the workspace once it is full.
  useEffect(() => {
    if (pending || !restoreFocus.current) return;
    restoreFocus.current = false;
    const visibleSearch = [...(root.current?.querySelectorAll<HTMLInputElement>("input[role=combobox]") ?? [])]
      .find((input) => input.offsetParent !== null);
    (visibleSearch ?? root.current)?.focus({ preventScroll: true });
  }, [pending, signature]);

  useEffect(() => {
    if (!fresh) return;
    const timer = window.setTimeout(() => setFresh(null), FRESH_COLUMN_MS);
    return () => window.clearTimeout(timer);
  }, [fresh]);

  function update(slugs: string[], { focusSearch = true } = {}) {
    if (navigating.current) return;
    const next = [...new Set(slugs)].slice(0, MAX_COMPARED_MODELS);
    requested.current = next;
    navigating.current = true;
    restoreFocus.current = focusSearch;
    setFailed(false);
    startTransition(async () => {
      try {
        await navigate({
          to: "/compare",
          search: next.length ? { models: next.join(",") } : {},
          resetScroll: false,
        });
        replace(next);
      } catch {
        requested.current = models.map((model) => model.slug);
        setLeaving(null);
        setFailed(true);
      } finally {
        navigating.current = false;
      }
    });
  }

  function add(slug: string) {
    if (requested.current.length >= MAX_COMPARED_MODELS) return;
    setFresh(slug);
    update([...requested.current, slug]);
  }

  function remove(slug: string) {
    setLeaving(slug);
    update(requested.current.filter((item) => item !== slug));
  }

  /** Replaces a compared model with another reasoning level of the same family. */
  function swap(slug: string, variant: string) {
    if (requested.current.includes(variant)) return;
    setFresh(variant);
    update(requested.current.map((item) => (item === slug ? variant : item)), { focusSearch: false });
  }

  async function share() {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setShareState("copied");
    } catch {
      setShareState({ url });
    }
  }

  const rows = useMemo(() => buildComparisonRows(models, t, lang), [models, t, lang]);
  const groupTitles = {
    benchmarks: t.compare.sections.benchmarks,
    performance: t.compare.sections.performance,
    pricing: copy.pricing,
    capabilities: t.compare.sections.capabilities,
    info: t.compare.sections.info,
  };
  const sections = visibleSections(rows, view, models.length > 1 && differencesOnly, groupTitles);
  const views: Array<{ value: ComparisonView; label: string }> = [
    { value: "essential", label: copy.essential },
    { value: "benchmarks", label: groupTitles.benchmarks },
    { value: "performance", label: groupTitles.performance },
    { value: "pricing", label: groupTitles.pricing },
    { value: "capabilities", label: groupTitles.capabilities },
    { value: "info", label: groupTitles.info },
    { value: "all", label: copy.all },
  ];
  const canAdd = models.length < MAX_COMPARED_MODELS && allModels.length > 0;
  const search = (compact: boolean) => (
    <CompareModelSearch
      options={allModels}
      selected={models.map((model) => model.slug)}
      onAdd={add}
      disabled={pending}
      inputRef={searchInput}
      compact={compact}
    />
  );

  return (
    <div ref={root} tabIndex={-1} className="flex min-w-0 flex-col gap-6 outline-none">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            <GitCompareArrows aria-hidden="true" className="size-5 text-muted-foreground sm:size-6" />
            {t.compare.title}
            <PageCat kind="compare" className="ml-2 self-end" />
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{copy.lead}</p>
        </div>
        {models.length > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" className="touch-target gap-2" disabled={pending} onClick={share}>
              {shareState === "copied" ? <Check className="size-4" /> : <Link2 className="size-4" />}
              {shareState === "copied" ? copy.copied : copy.share}
            </Button>
            <Button variant="ghost" className="touch-target" disabled={pending} onClick={() => update([])}>
              {t.compare.clear}
            </Button>
          </div>
        )}
      </header>

      {typeof shareState === "object" && (
        <input
          aria-label={copy.share}
          readOnly
          value={shareState.url}
          onFocus={(event) => event.currentTarget.select()}
          className="h-11 rounded-lg border bg-card px-3 text-sm"
        />
      )}

      <p role="status" aria-live="polite" className="sr-only">
        {pending ? t.compare.loading : t.compare.selectedCount(models.length)}
      </p>
      {failed && <p role="alert" className="text-sm text-destructive">{copy.failed}</p>}

      {models.length === 0 ? (
        <EmptyComparison allModels={allModels} search={search(false)} pending={pending} onAdd={add} />
      ) : (
        <>
          <section aria-label={t.compare.select} className="space-y-3 lg:hidden">
            <ol className="grid gap-2 sm:grid-cols-2">
              {models.map((model, index) => (
                <li
                  key={model.slug}
                  className={`rounded-xl border bg-card p-3 ${model.slug === fresh ? "compare-column-fresh" : ""} ${model.slug === leaving ? "compare-column-leaving" : ""}`}
                >
                  <ComparedModel model={model} index={index} disabled={pending} onRemove={() => remove(model.slug)} />
                </li>
              ))}
            </ol>
            {canAdd && search(false)}
          </section>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="w-full sm:hidden">
              <CatalogSelect value={view} onChange={setView} label={copy.metrics} options={views} />
            </div>
            <SegmentedControl
              value={view}
              onChange={setView}
              options={views}
              label={copy.metrics}
              size="sm"
              className="hidden overflow-x-auto sm:inline-flex"
            />
            <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm">
              <Switch
                checked={models.length > 1 && differencesOnly}
                disabled={models.length < 2}
                onCheckedChange={setDifferencesOnly}
              />
              {copy.differences}
            </label>
          </div>

          <p className="-mt-3 text-xs leading-5 text-muted-foreground">
            {models.length < 2 ? copy.addSecond : copy.legend}
          </p>

          <ComparisonMatrix
            models={models}
            sections={sections}
            viewKey={`${view}-${differencesOnly}`}
            pending={pending}
            leaving={leaving}
            fresh={fresh}
            addColumn={canAdd ? (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  {t.compare.addModel} · {models.length}/{MAX_COMPARED_MODELS}
                </p>
                {search(true)}
              </div>
            ) : null}
            onRemove={remove}
            empty={copy.noMetrics}
          />
          <ComparisonStack
            models={models}
            sections={sections}
            viewKey={`${view}-${differencesOnly}`}
            pending={pending}
            empty={copy.noMetrics}
          />
          <p className="text-xs text-muted-foreground">{copy.configurations}</p>

          <ComparisonTradeoff models={models} families={families} onSelectVariant={swap} />
        </>
      )}
    </div>
  );
}

function EmptyComparison({
  allModels,
  search,
  pending,
  onAdd,
}: {
  allModels: CompareModelOption[];
  search: React.ReactNode;
  pending: boolean;
  onAdd: (slug: string) => void;
}) {
  const { t } = useI18n();
  const copy = t.compareWorkspace;
  if (!allModels.length) {
    return (
      <section className="rounded-xl border border-dashed p-8 text-center">
        <h2 className="font-medium">{t.grid.unavailableTitle}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t.grid.unavailableDescription}</p>
      </section>
    );
  }
  const suggestions = [...allModels]
    .filter((model) => model.intelligence_score != null)
    .sort((a, b) => (b.intelligence_score ?? 0) - (a.intelligence_score ?? 0))
    .slice(0, 4);
  return (
    <section className="rounded-xl border bg-card p-5 sm:p-8">
      <h2 className="text-base font-semibold">{copy.start}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{copy.startHint}</p>
      <div className="mt-5 max-w-xl">{search}</div>
      {suggestions.length > 0 && (
        <>
          <h3 className="mt-6 text-xs font-medium text-muted-foreground">{copy.suggestions}</h3>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {suggestions.map((model) => (
              <button
                key={model.slug}
                type="button"
                disabled={pending}
                onClick={() => onAdd(model.slug)}
                className="flex min-h-14 items-center gap-3 rounded-lg border bg-background px-3 py-2 text-left transition-[background-color,border-color,transform] duration-150 hover:border-foreground/25 hover:bg-muted/40 active:scale-[0.98]"
              >
                <ModelProviderIcon
                  provider={getModelProviderKey(model.slug, model.model_creator.slug)}
                  iconUrl={model.provider_icon_url}
                  size={24}
                />
                <span className="min-w-0 flex-1 text-sm font-medium leading-5">{model.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
