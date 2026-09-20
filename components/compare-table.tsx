import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { useNavigate } from "@tanstack/react-router";
import { Link } from "@/components/link";
import {
  ArrowRight,
  ChevronLeft,
  Check,
  GitCompareArrows,
  X,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import { ModelProviderIcon } from "@/components/model-provider-icon";
import { CompareModelSearch } from "@/components/compare-model-search";
import { getModelProviderKey } from "@/lib/provider-map";
import { useI18n } from "@/lib/i18n";
import { useCompare } from "@/lib/compare-store";
import { cn } from "@/lib/utils";
import {
  bestComparisonValue,
  buildComparisonRows,
  comparisonHasDifferences,
  type ComparisonRow,
  type ComparisonValue,
  type ComparisonGroup,
} from "@/lib/comparison-rows";
import type { LLMModel } from "@/lib/api";
import type { CompareModelOption } from "@/lib/compare-model";
import { fetchModelCapabilities } from "@/lib/server-fns";
import { enrichComparisonModel } from "@/lib/comparison-models";

type View = ComparisonGroup | "essential" | "all";
function formatValue(
  value: ComparisonValue,
  row: ComparisonRow,
  yes: string,
  no: string,
): string {
  if (value === null) return "—";
  if (typeof value === "boolean") return value ? yes : no;
  if (typeof value === "string") return value || "—";
  if (row.format === "percent") return `${(value * 100).toFixed(1)}%`;
  if (row.format === "money") return `$${Number(value.toPrecision(4))}`;
  if (row.format === "seconds") return `${Number(value.toFixed(2))} s`;
  if (row.format === "speed") return `${Number(value.toFixed(1))} t/s`;
  if (row.format === "elo") return `${Math.round(value)} Elo`;
  if (row.format === "rank") return `#${value}`;
  if (row.format === "tokens" && value >= 1000)
    return value >= 1e6
      ? `${Number((value / 1e6).toFixed(2))}M`
      : `${Number((value / 1000).toFixed(1))}K`;
  return String(Number(value.toFixed(2)));
}

export function CompareTable({
  models: baseModels,
  allModels,
}: {
  models: LLMModel[];
  allModels: CompareModelOption[];
}) {
  const { t, lang } = useI18n();
  const capabilityRequests = useRef(
    new Map<string, Promise<Partial<LLMModel>>>(),
  );
  const [supplements, setSupplements] = useState<
    Record<string, Partial<LLMModel>>
  >({});
  const models = useMemo(
    () =>
      baseModels.map((model) =>
        enrichComparisonModel(model, supplements[model.slug]),
      ),
    [baseModels, supplements],
  );
  useEffect(() => {
    let cancelled = false;
    const selected = new Set(baseModels.map((model) => model.slug));
    setSupplements((current) => Object.fromEntries(
      Object.entries(current).filter(([slug]) => selected.has(slug)),
    ));
    // Cached values render immediately; individual upstream details arrive independently.
    for (const model of baseModels) {
      let request = capabilityRequests.current.get(model.slug);
      if (!request) {
        request = fetchModelCapabilities({ data: model.slug });
        if (capabilityRequests.current.size >= 20)
          capabilityRequests.current.delete(
            capabilityRequests.current.keys().next().value!,
          );
        capabilityRequests.current.set(model.slug, request);
      }
      void request
        .then((extra) => {
          if (!cancelled)
            setSupplements((current) => ({ ...current, [model.slug]: extra }));
        })
        .catch(() => {
          if (capabilityRequests.current.get(model.slug) === request)
            capabilityRequests.current.delete(model.slug);
          /* The existing catalogue remains fully usable. */
        });
    }
    return () => {
      cancelled = true;
    };
  }, [baseModels]);
  const copy = t.compareWorkspace;
  const navigate = useNavigate({ from: "/compare" });
  const { replace } = useCompare();
  const [pending, startTransition] = useTransition();
  const [view, setView] = useState<View>("essential");
  const [differences, setDifferences] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const search = useRef<HTMLInputElement>(null);
  const workspace = useRef<HTMLDivElement>(null);
  const previousPositions = useRef(new Map<string, { x: number; y: number }>());
  const animations = useRef<Animation[]>([]);
  const requested = useRef(models.map((model) => model.slug));
  const navigating = useRef(false);
  const restoreFocus = useRef(false);
  const signature = models.map((model) => model.slug).join(",");
  const full = models.length === 4;
  useEffect(() => {
    requested.current = models.map((model) => model.slug);
    replace(requested.current);
  }, [signature, models, replace]);

  useEffect(() => {
    setCopied(false);
    setShareUrl("");
  }, [signature]);

  useEffect(() => {
    if (pending || !restoreFocus.current) return;
    restoreFocus.current = false;
    (search.current ?? workspace.current)?.focus({ preventScroll: true });
  }, [pending, signature]);

  useLayoutEffect(() => {
    animations.current.forEach((animation) => animation.cancel());
    animations.current = [];
    const next = new Map<string, { x: number; y: number }>();
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    workspace.current
      ?.querySelectorAll<HTMLElement>("[data-comparison-model]")
      .forEach((element) => {
        const key = element.dataset.comparisonModel!;
        const bounds = element.getBoundingClientRect();
        const rect = {
          x: bounds.x + window.scrollX,
          y: bounds.y + window.scrollY,
        };
        const old = previousPositions.current.get(key);
        next.set(key, rect);
        if (reduce || !element.animate) return;
        const frames = old
          ? [
              {
                transform: `translate(${old.x - rect.x}px, ${old.y - rect.y}px)`,
              },
              { transform: "translate(0, 0)" },
            ]
          : [
              { opacity: 0.4, transform: "translateY(5px)" },
              { opacity: 1, transform: "translateY(0)" },
            ];
        animations.current.push(
          element.animate(frames, {
            duration: 180,
            easing: "cubic-bezier(.2,.8,.2,1)",
          }),
        );
      });
    previousPositions.current = next;
    return () => animations.current.forEach((animation) => animation.cancel());
  }, [signature]);

  function update(slugs: string[]) {
    if (navigating.current) return;
    const next = [...new Set(slugs)].slice(0, 4);
    requested.current = next;
    navigating.current = true;
    restoreFocus.current = true;
    setFailed(false);
    setCopied(false);
    setShareUrl("");
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
        setFailed(true);
      } finally {
        navigating.current = false;
      }
    });
  }
  function add(slug: string) {
    if (requested.current.length < 4) update([...requested.current, slug]);
  }
  async function share() {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setShareUrl(url);
    }
  }
  const rows = useMemo(
    () => buildComparisonRows(models, t, lang),
    [models, t, lang],
  );
  const visible = rows.filter(
    (row) =>
      (view === "all" ||
        (view === "essential" ? row.essential : row.group === view)) &&
      (models.length < 2 || !differences || comparisonHasDifferences(row)),
  );
  const groups: Array<[View, string]> = [
    ["essential", copy.essential],
    ["benchmarks", t.compare.sections.benchmarks],
    ["performance", t.compare.sections.performance],
    ["pricing", copy.pricing],
    ["capabilities", t.compare.sections.capabilities],
    ["info", t.compare.sections.info],
    ["all", copy.all],
  ];
  const suggestions = allModels.slice(0, 4);

  return (
    <div ref={workspace} tabIndex={-1} className="flex min-w-0 flex-col gap-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <GitCompareArrows
              aria-hidden="true"
              className="size-5 text-muted-foreground"
            />
            {t.compare.title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{copy.lead}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" asChild className="touch-target">
            <Link href="/">
              <ChevronLeft className="size-4" />
              {t.compare.backToList}
            </Link>
          </Button>
          {models.length > 0 && (
            <>
              <Button
                variant="outline"
                className="touch-target"
                disabled={pending}
                onClick={share}
              >
                {copied ? copy.copied : copy.share}
              </Button>
              <Button
                variant="ghost"
                className="touch-target"
                disabled={pending}
                onClick={() => update([])}
              >
                {t.compare.clear}
              </Button>
            </>
          )}
        </div>
      </header>
      {shareUrl && (
        <input
          aria-label={copy.share}
          readOnly
          value={shareUrl}
          onFocus={(event) => event.currentTarget.select()}
          className="h-11 rounded-lg border bg-background px-3 text-sm"
        />
      )}
      <section
        aria-label={t.compare.select}
        className="rounded-xl border bg-card p-4 sm:p-5"
      >
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => {
            const model = models[index];
            return model ? (
              <article
                key={model.slug}
                data-comparison-model={model.slug}
                className="grid min-w-0 grid-cols-[1fr_auto] items-start gap-2 rounded-lg border bg-background p-3"
              >
                <ModelProviderIcon
                  provider={getModelProviderKey(
                    model.slug,
                    model.model_creator.slug,
                  )}
                  iconUrl={model.provider_icon_url}
                  size={24}
                />
                <div className="col-span-2 row-start-2 min-w-0">
                  <Link
                    className="block break-words text-sm font-medium leading-5 hover:underline"
                    href={`/models/${model.slug}`}
                  >
                    {model.name}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {model.model_creator.name}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={pending}
                  aria-label={`${t.compare.remove} ${model.name}`}
                  className="touch-target col-start-2 row-start-1 -mr-1 -mt-1 shrink-0"
                  onClick={() =>
                    update(
                      models
                        .filter((item) => item.slug !== model.slug)
                        .map((item) => item.slug),
                    )
                  }
                >
                  <X className="size-3.5" />
                </Button>
              </article>
            ) : (
              <button
                key={`slot-${index}`}
                type="button"
                disabled={pending || !allModels.length}
                onClick={() => search.current?.focus()}
                className="flex min-h-24 items-center justify-center gap-2 rounded-lg border border-dashed px-3 text-sm text-muted-foreground transition-colors hover:border-foreground/40 hover:bg-muted/40"
              >
                <span className="font-mono text-xs">0{index + 1}</span>
                {t.compare.addModel}
              </button>
            );
          })}
        </div>
        {!full && (
          <div className="mt-4">
            <CompareModelSearch
              options={allModels}
              selected={models.map((model) => model.slug)}
              onAdd={add}
              disabled={pending || !allModels.length}
              inputRef={search}
            />
          </div>
        )}
        <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
          <p>{copy.configurations}</p>
          <p role="status" aria-live="polite">
            {pending
              ? t.compare.loading
              : t.compare.selectedCount(models.length)}
            {copied && ` · ${copy.copied}`}
          </p>
        </div>
        {failed && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {copy.failed}
          </p>
        )}
      </section>
      {models.length === 0 ? (
        <section className="py-3">
          <h2 className="text-sm font-medium">
            {allModels.length ? copy.start : t.grid.unavailableTitle}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {allModels.length ? copy.startHint : t.grid.unavailableDescription}
          </p>
          {allModels.length > 0 && (
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {suggestions.map((model) => (
                <button
                  key={model.slug}
                  disabled={pending}
                  type="button"
                  onClick={() => add(model.slug)}
                  className="flex min-h-16 items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors hover:bg-muted/40"
                >
                  <ModelProviderIcon
                    provider={getModelProviderKey(
                      model.slug,
                      model.model_creator.slug,
                    )}
                    iconUrl={model.provider_icon_url}
                    size={22}
                  />
                  <span className="min-w-0 flex-1 text-sm">{model.name}</span>
                  <ArrowRight
                    aria-hidden="true"
                    className="size-4 shrink-0 text-muted-foreground"
                  />
                </button>
              ))}
            </div>
          )}
        </section>
      ) : (
        <section
          aria-label={t.compare.title}
          aria-busy={pending}
          className="min-w-0 space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div
              aria-label={copy.metrics}
              role="group"
              className="flex max-w-full flex-wrap gap-1 rounded-lg bg-muted/40 p-1"
            >
              {groups.map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={view === key}
                  onClick={() => setView(key)}
                  className={cn(
                    "touch-target rounded-md px-3 py-2 text-xs transition-colors",
                    view === key
                      ? "bg-background font-medium shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <label className="flex min-h-11 cursor-pointer items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={models.length > 1 && differences}
                disabled={models.length < 2}
                onChange={(event) => setDifferences(event.target.checked)}
                className="accent-primary"
              />
              {copy.differences}
            </label>
          </div>
          <p className="text-xs leading-5 text-muted-foreground">
            {models.length < 2 ? copy.addSecond : copy.legend}
          </p>
          <div
            className="max-w-full overflow-x-auto rounded-xl border bg-card"
            tabIndex={0}
            role="region"
            aria-label={copy.scrollHint}
          >
            <table className="w-full border-collapse text-sm">
              <caption className="sr-only">{t.compare.title}</caption>
              <thead>
                <tr className="border-b">
                  <th
                    scope="col"
                    className="sticky left-0 z-10 w-32 min-w-32 bg-card p-3 text-left text-xs font-medium text-muted-foreground sm:w-44 sm:min-w-44"
                  >
                    {copy.metrics}
                  </th>
                  {models.map((model) => (
                    <th
                      key={model.slug}
                      scope="col"
                      className="min-w-44 max-w-64 p-3 text-center text-xs font-medium"
                    >
                      <Link
                        href={`/models/${model.slug}`}
                        className="hover:underline"
                      >
                        {model.name}
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody key={view} className="compare-metrics-enter">
                {visible.map((row) => {
                  const best = bestComparisonValue(row);
                  return (
                    <tr
                      key={row.id}
                      className="border-b last:border-0 hover:bg-muted/20"
                    >
                      <th
                        scope="row"
                        className="sticky left-0 z-10 border-r bg-card p-3 text-left text-xs font-normal leading-5 text-muted-foreground"
                      >
                        {row.label}
                      </th>
                      {row.values.map((value, index) => {
                        const winner = best !== null && value === best;
                        return (
                          <td
                            key={models[index].slug}
                            className={cn(
                              "p-3 text-center text-xs tabular-nums",
                              winner && "bg-chart-1-soft font-semibold",
                            )}
                          >
                            <span className="inline-flex items-center justify-center gap-1.5">
                              {winner && (
                                <>
                                  <Check
                                    aria-hidden="true"
                                    className="size-3.5 shrink-0"
                                  />
                                  <span className="sr-only">
                                    {t.compare.best}:{" "}
                                  </span>
                                </>
                              )}
                              {formatValue(value, row, copy.yes, copy.no)}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!visible.length && (
              <p
                role="status"
                className="p-8 text-center text-sm text-muted-foreground"
              >
                {copy.noMetrics}
              </p>
            )}
          </div>
          <p className="text-xs text-muted-foreground sm:hidden">
            {copy.scrollHint}
          </p>
        </section>
      )}
    </div>
  );
}
