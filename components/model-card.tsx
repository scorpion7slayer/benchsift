import { Link } from "@/components/link";
import { ArrowRight, Plus, Check, Brain, Unlock } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useCompare } from "@/lib/compare-store";
import { ModelProviderIcon } from "@/components/model-provider-icon";
import { ModelAvailabilityBadge } from "@/components/model-availability";
import { StealthBadge } from "./stealth-history";
import { getModelProviderKey } from "@/lib/provider-map";
import { formatCatalogPrice, formatNumber, formatSeconds, formatSpeed, formatTokens } from "@/lib/format";
import { isOpenWeightsModel, mediaBenchmarkValues, textMetricValue } from "@/lib/model-metrics";
import type { LLMModel } from "@/lib/model-types";
import type { SortKey } from "@/lib/model-grid-logic";
import { formatSortValue } from "@/components/catalog/sort-controls";

const NEW_MODEL_DAYS = 30;
const DAY_MS = 86_400_000;

/** Sorts whose value the card already shows in large type. */
const PROMINENT_SORTS = new Set<SortKey>(["intelligence", "coding", "math", "name"]);

/** Advanced catalogue entry below the desktop breakpoint, where the table does not fit. */
export function ModelCard({ model, sort }: { model: LLMModel; sort?: SortKey }) {
  const { t, lang } = useI18n();
  const { toggle, isSelected, isFull } = useCompare();
  const selected = isSelected(model.slug);
  const creator = model.model_creator.slug === "stealth" ? t.stealth.unknownCreator : model.model_creator.name;
  const isNew = Boolean(model.release_date && new Date(model.release_date).getTime() >= Date.now() - NEW_MODEL_DAYS * DAY_MS);

  const indices = [
    [t.card.intelligence, textMetricValue(model, "artificial_analysis_intelligence_index")],
    [t.card.coding, textMetricValue(model, "artificial_analysis_coding_index")],
    [t.card.math, textMetricValue(model, "artificial_analysis_math_index")],
  ] as const;
  const media = mediaBenchmarkValues(model)[0];
  const scores = indices.some(([, value]) => value != null)
    ? indices.filter(([, value]) => value != null).map(([label, value]) => [label, formatNumber(value, lang)])
    : media ? [[media.label[lang], `${formatNumber(media.elo, lang, 0)} Elo`]] : [];
  const specs = [
    [t.card.speed, formatSpeed(model.median_output_tokens_per_second, lang)],
    [t.card.price1m, formatCatalogPrice(model.pricing, lang)],
    [t.detail.contextWindow, formatTokens(model.context_window_tokens, lang)],
    ["TTFT", formatSeconds(model.median_time_to_first_token_seconds, lang)],
  ];

  return (
    <article
      data-selected={selected || undefined}
      className="catalog-card group relative flex h-full flex-col rounded-xl border bg-card text-card-foreground data-[selected=true]:border-primary"
    >
      <div className="flex items-start gap-3 px-4 pt-4">
        <ModelProviderIcon provider={getModelProviderKey(model.slug, model.model_creator.slug)} size={44} iconUrl={model.provider_icon_url} />
        <div className="min-w-0 flex-1 py-0.5">
          <h3 className="text-[15px] font-semibold leading-snug [overflow-wrap:anywhere]">
            {/* The stretched link makes the whole card clickable without nesting buttons in it. */}
            <Link
              href={`/models/${model.slug}`}
              className="rounded-sm after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring"
            >
              {model.name}
            </Link>
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">{creator}</p>
        </div>
        <Button
          type="button"
          variant={selected ? "default" : "outline"}
          size="icon-lg"
          onClick={() => toggle(model.slug)}
          disabled={!selected && isFull}
          aria-pressed={selected}
          aria-label={`${selected ? t.card.removeCompare : t.card.addCompare} · ${model.name}`}
          title={!selected && isFull ? t.compare.maxReached : undefined}
          className="selection-button relative z-10 size-11 shrink-0 rounded-lg"
        >
          {selected ? <Check className="size-4" /> : <Plus className="size-4" />}
        </Button>
      </div>

      <div className="mt-3 flex min-h-5 flex-wrap items-center gap-1.5 px-4">
        {isNew && <Badge variant="secondary" className="text-[11px]">{t.card.newBadge}</Badge>}
        {model.reasoning_model && <Badge variant="secondary" className="gap-1 text-[11px]"><Brain className="size-3" />{t.detail.reasoning}</Badge>}
        {isOpenWeightsModel(model) && <Badge variant="outline" className="gap-1 text-[11px]"><Unlock className="size-3" />{t.card.openWeightsBadge}</Badge>}
        <ModelAvailabilityBadge model={model} compact />
        <StealthBadge model={model} />
      </div>

      <div className="flex flex-1 flex-col px-4">
        {sort && !PROMINENT_SORTS.has(sort) && (
          <p className="mt-3 flex items-baseline justify-between gap-3 rounded-lg bg-muted/60 px-3 py-2 text-xs">
            <span className="text-muted-foreground">{t.grid.sorts[sort]}</span>
            <span className="font-semibold tabular-nums">{formatSortValue(model, sort, lang)}</span>
          </p>
        )}
        {scores.length > 0 ? (
          <dl className="my-4 flex divide-x border-y py-3">
            {scores.map(([label, value]) => (
              <div key={label} className="min-w-0 flex-1 px-3 first:pl-0 last:pr-0">
                <dt className="truncate text-xs text-muted-foreground" title={label}>{label}</dt>
                <dd className="mt-1 text-xl font-semibold tracking-tight tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="my-4 border-y py-4 text-xs text-muted-foreground">{t.catalogUi.noBenchmarks}</p>
        )}
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 pb-4 text-xs">
          {specs.map(([label, value]) => (
            <div key={label} className="min-w-0">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="mt-1 font-medium tabular-nums [overflow-wrap:anywhere]">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-auto flex items-center justify-between gap-3 border-t py-3 text-xs">
          <span className="text-muted-foreground">
            {model.openrouter_weekly_rank != null ? `OpenRouter #${model.openrouter_weekly_rank}` : creator}
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            {t.catalogUi.viewModel}
            <ArrowRight aria-hidden="true" className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </article>
  );
}
