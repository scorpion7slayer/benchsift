import { Link as RouterLink } from "@tanstack/react-router";
import { Boxes, GitCompareArrows } from "@/components/icons";
import { Link } from "@/components/link";
import { ModelProviderIcon } from "@/components/model-provider-icon";
import { Button } from "@/components/ui/button";
import { formatMoney, formatNumber, formatSpeed } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { LLMModel } from "@/lib/model-types";
import type { SimilarModel } from "@/lib/model-insights";
import { textMetricValue } from "@/lib/model-metrics";
import { getModelProviderKey } from "@/lib/provider-map";
import { cn } from "@/lib/utils";
import { DetailCard } from "./detail-primitives";

/** Signed difference with the current model, e.g. "+1.2" or "−0.4". */
function Delta({ value, lang }: { value: number; lang: "fr" | "en" }) {
  if (Math.abs(value) < 0.05) return null;
  const sign = value > 0 ? "+" : "−";
  return (
    <span className={cn("text-[11px] tabular-nums", value > 0 ? "text-foreground" : "text-muted-foreground")}>
      {sign}{formatNumber(Math.abs(value), lang)}
    </span>
  );
}

/**
 * The closest models on the Intelligence Index, so a reader can weigh this
 * model against comparable ones and open the comparison in one step.
 */
export function SimilarModelsCard({ model, similar }: { model: LLMModel; similar: SimilarModel[] }) {
  const { t, lang } = useI18n();
  const intelligence = textMetricValue(model, "artificial_analysis_intelligence_index");
  if (!similar.length || intelligence == null) return null;

  return (
    <DetailCard icon={Boxes} title={t.detail.similarTitle} description={t.detail.similarHint} contentClassName="p-0">
      <div aria-hidden="true" className="hidden grid-cols-[2rem_minmax(0,1fr)_5rem_5rem_5.5rem_6.5rem] gap-x-3 border-b px-6 py-2 text-xs font-medium text-muted-foreground sm:grid">
        <span />
        <span>{t.grid.modelColumn}</span>
        <span className="text-right">{t.card.intelligence}</span>
        <span className="text-right">{t.card.price1m}</span>
        <span className="text-right">{t.card.speed}</span>
        <span />
      </div>
      <ul className="divide-y">
        {similar.map((entry) => (
          <li key={entry.slug} className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-4 py-3 sm:grid-cols-[2rem_minmax(0,1fr)_5rem_5rem_5.5rem_6.5rem] sm:px-6">
            <ModelProviderIcon provider={getModelProviderKey(entry.slug, entry.creatorSlug)} iconUrl={entry.providerIconUrl} size={28} />
            <div className="min-w-0">
              <Link
                href={`/models/${entry.slug}`}
                className="block truncate rounded-sm text-sm font-medium underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                title={entry.name}
              >
                {entry.name}
              </Link>
              <p className="truncate text-xs text-muted-foreground">
                {entry.creatorName}
                <span className="sm:hidden"> · {formatMoney(entry.price, lang)} · {formatSpeed(entry.speed, lang)}</span>
              </p>
            </div>
            <div className="hidden flex-col items-end sm:flex">
              <span className="text-sm font-semibold tabular-nums">{formatNumber(entry.intelligence, lang)}</span>
              <Delta value={entry.intelligence - intelligence} lang={lang} />
            </div>
            <span className="hidden text-right text-sm tabular-nums text-muted-foreground sm:block" title={t.card.price1m}>
              {formatMoney(entry.price, lang)}
            </span>
            <span className="hidden text-right text-sm tabular-nums text-muted-foreground sm:block" title={t.detail.outputSpeed}>
              {formatSpeed(entry.speed, lang)}
            </span>
            <Button asChild variant="outline" size="sm" className="touch-target gap-1.5 justify-self-end">
              <RouterLink
                to="/compare"
                search={{ models: `${model.slug},${entry.slug}` }}
                aria-label={t.detail.compareWith(entry.name)}
              >
                <GitCompareArrows aria-hidden="true" className="size-3.5" />
                <span className="hidden sm:inline">{t.compare.compare}</span>
              </RouterLink>
            </Button>
          </li>
        ))}
      </ul>
    </DetailCard>
  );
}
