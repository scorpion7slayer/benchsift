import { StealthBadge } from "./stealth-history";
import { Brain, Check, Plus, Unlock } from "@/components/icons";
import { Link } from "@/components/link";
import { ModelProviderIcon } from "@/components/model-provider-icon";
import { Button } from "@/components/ui/button";
import { useCompare } from "@/lib/compare-store";
import { formatMoney, formatNumber, formatSpeed, formatTokens } from "@/lib/format";
import type { HomeCatalogModel } from "@/lib/home-catalog";
import { useI18n, type Lang, type Translations } from "@/lib/i18n";
import { normalRankingValue, type NormalRankingKey } from "@/lib/model-grid-logic";
import { getModelProviderKey } from "@/lib/provider-map";
import { cn } from "@/lib/utils";

/** Shared by the rows and their header so every column lines up. */
const ROW_GRID =
  "grid grid-cols-[2.25rem_2.5rem_minmax(0,1fr)_4.5rem_2.75rem] items-center gap-2 px-2 sm:grid-cols-[3rem_2.25rem_minmax(0,1fr)_5rem_2.75rem] sm:gap-3 sm:px-3 md:grid-cols-[3rem_2.25rem_minmax(0,1fr)_5.5rem_5.5rem_5.5rem_2.75rem] lg:grid-cols-[3rem_2.25rem_minmax(0,1fr)_6rem_6rem_6rem_6rem_2.75rem]";

/** Context columns that sit beside the ranked metric on wider screens. */
const SECONDARY_POOL: NormalRankingKey[] = ["intelligence", "price_asc", "speed"];

function secondaryMetrics(primary: NormalRankingKey): NormalRankingKey[] {
  return SECONDARY_POOL.filter((key) => key !== primary).slice(0, 2);
}

function metricLabel(metric: NormalRankingKey, t: Translations): string {
  if (metric === "intelligence") return t.grid.ranking.general;
  if (metric === "price_asc") return t.grid.ranking.price;
  return t.grid.ranking[metric];
}

function formatMetric(metric: NormalRankingKey, value: number | null, lang: Lang): string {
  if (metric === "speed") return formatSpeed(value, lang);
  if (metric === "price_asc") return formatMoney(value, lang);
  return formatNumber(value, lang);
}

export function RankedListHeader({ metric }: { metric: NormalRankingKey }) {
  const { t } = useI18n();
  return (
    <div aria-hidden="true" className={cn(ROW_GRID, "hidden border-b py-2.5 text-xs font-medium text-muted-foreground md:grid")}>
      <span className="text-center">#</span>
      <span />
      <span>{t.grid.modelColumn}</span>
      <span className="text-right text-foreground">{metricLabel(metric, t)}</span>
      {secondaryMetrics(metric).map((key) => <span key={key} className="text-right">{metricLabel(key, t)}</span>)}
      <span className="hidden text-right lg:block">{t.grid.contextShort}</span>
      <span />
    </div>
  );
}

const NEW_MODEL_DAYS = 30;

/** Short facts under a model name: open weights, reasoning, recent release. */
function RowBadges({ model }: { model: HomeCatalogModel }) {
  const { t } = useI18n();
  const released = model.release_date ? Date.parse(model.release_date) : Number.NaN;
  // Same rule as the Advanced cards; server and client agree except within
  // seconds of the 30-day boundary.
  const isNew = Number.isFinite(released) && Date.now() - released <= NEW_MODEL_DAYS * 86_400_000;
  const badges = [
    isNew && { key: "new", label: t.card.newBadge, icon: null },
    model.reasoning_model && { key: "reasoning", label: t.detail.reasoning, icon: Brain },
    model.is_open_weights && { key: "open", label: t.card.openWeightsBadge, icon: Unlock },
  ].filter(Boolean) as Array<{ key: string; label: string; icon: typeof Brain | null }>;
  if (!badges.length) return null;
  return (
    <span className="mt-1 flex flex-wrap gap-1">
      {badges.map(({ key, label, icon: Icon }) => (
        <span
          key={key}
          className={cn(
            "inline-flex items-center gap-1 rounded border px-1.5 py-px text-[10px] font-medium leading-4",
            key === "new" ? "border-foreground/30 text-foreground" : "text-muted-foreground",
          )}
        >
          {Icon && <Icon aria-hidden="true" className="size-3" />}
          {label}
        </span>
      ))}
    </span>
  );
}

export function RankedModelRow({
  model,
  rank,
  metric,
  best,
}: {
  model: HomeCatalogModel;
  rank?: number;
  metric: NormalRankingKey;
  /** Top value of the ranking, for the bar under each score (scores and speed only). */
  best?: number | null;
}) {
  const { t, lang } = useI18n();
  const { toggle, isSelected, isFull } = useCompare();
  const selected = isSelected(model.slug);
  const primaryLabel = metricLabel(metric, t);
  const primaryRaw = normalRankingValue(model, metric);
  const primaryValue = formatMetric(metric, primaryRaw, lang);
  // Price ranks cheapest first, so a bar against the top value would read backwards.
  const share = metric !== "price_asc" && best && primaryRaw != null ? Math.min(Math.max(primaryRaw / best, 0), 1) : null;
  const creator = model.model_creator.slug === "stealth" ? t.stealth.unknownCreator : model.model_creator.name;

  return (
    <li
      value={rank}
      data-selected={selected ? "true" : undefined}
      className={cn(
        ROW_GRID,
        "min-h-16 border-b py-2 transition-colors duration-150 last:border-b-0 hover:bg-muted/40 data-[selected=true]:bg-primary/[0.04] sm:min-h-14",
      )}
    >
      <span
        className="text-center text-sm font-semibold tabular-nums text-muted-foreground sm:text-base"
        aria-label={rank == null ? t.stealth.unranked : t.grid.ranking.rank(rank)}
      >
        {rank == null ? "—" : rank}
      </span>

      <span className="flex size-10 items-center justify-center sm:size-9">
        <ModelProviderIcon provider={getModelProviderKey(model.slug, model.model_creator.slug)} size={32} iconUrl={model.provider_icon_url} />
      </span>

      <Link
        href={`/models/${model.slug}`}
        className="min-w-0 rounded-md py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="block break-words text-sm font-medium sm:truncate sm:text-[15px]">{model.name}</span>
        <span className="block text-xs text-muted-foreground sm:truncate">
          {creator}
          {/* Phones hide the extra columns, so their values join the creator line. */}
          {secondaryMetrics(metric).map((key) => {
            const value = normalRankingValue(model, key);
            return value == null ? null : <span key={key} className="md:hidden"> · {formatMetric(key, value, lang)}</span>;
          })}
        </span>
        <RowBadges model={model} />
        <StealthBadge model={model} />
      </Link>

      <span
        className="flex flex-col items-end gap-1 text-right text-sm font-semibold tabular-nums tracking-tight sm:text-base"
        aria-label={`${primaryLabel}: ${primaryValue}`}
        title={primaryLabel}
      >
        {primaryValue}
        {share != null && (
          <span aria-hidden="true" className="h-1 w-full max-w-16 overflow-hidden rounded-full bg-muted">
            <span className="compare-bar block h-full w-full origin-left rounded-full bg-foreground/50" style={{ transform: `scaleX(${share})` }} />
          </span>
        )}
      </span>

      {secondaryMetrics(metric).map((key) => {
        const label = metricLabel(key, t);
        const value = formatMetric(key, normalRankingValue(model, key), lang);
        return (
          <span key={key} className="hidden text-right text-sm tabular-nums text-muted-foreground md:block" aria-label={`${label}: ${value}`}>
            {value}
          </span>
        );
      })}
      <span className="hidden text-right text-sm tabular-nums text-muted-foreground lg:block" aria-label={`${t.detail.contextWindow}: ${formatTokens(model.context_window_tokens, lang)}`}>
        {formatTokens(model.context_window_tokens, lang)}
      </span>

      <Button
        type="button"
        variant={selected ? "default" : "ghost"}
        size="icon-sm"
        onClick={() => toggle(model.slug)}
        disabled={!selected && isFull}
        aria-pressed={selected}
        aria-label={`${selected ? t.card.removeCompare : t.card.addCompare} · ${model.name}`}
        title={!selected && isFull ? t.compare.maxReached : selected ? t.card.removeCompare : t.card.addCompare}
        className="selection-button touch-target size-11 justify-self-end sm:size-8"
      >
        {selected ? <Check /> : <Plus />}
      </Button>
    </li>
  );
}
