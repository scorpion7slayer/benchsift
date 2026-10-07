import { useMemo, useState } from "react";
import { TradeoffChart, type ChartScale, type ChartSeries } from "@/components/tradeoff-chart";
import {
  AXIS_BETTER,
  AXIS_ORDER,
  SCORE_ORDER,
  TradeoffControls,
  formatAxis,
  formatScore,
  pointTag,
} from "@/components/tradeoff/tradeoff-options";
import type { LLMModel } from "@/lib/model-types";
import { useI18n } from "@/lib/i18n";
import type { ComparisonFamily, TradeoffAxis, TradeoffScore } from "@/lib/model-insights";
import { seriesColor } from "./compared-model";

/**
 * Score against cost for the compared models. Each model is drawn with the
 * other reasoning levels of its family, so the chart shows how much score
 * each extra level of reasoning buys, and a level can be swapped in.
 */
export function ComparisonTradeoff({
  models,
  families,
  onSelectVariant,
}: {
  models: LLMModel[];
  families: Record<string, ComparisonFamily>;
  onSelectVariant: (comparedSlug: string, variantSlug: string) => void;
}) {
  const { t, lang } = useI18n();
  const copy = t.tradeoff;
  const [chosenAxis, setChosenAxis] = useState<TradeoffAxis | null>(null);
  const [chosenScore, setScore] = useState<TradeoffScore>("intelligence");
  const [scale, setScale] = useState<ChartScale>("linear");

  // The point of each compared model: the configuration shown in the table.
  const compared = useMemo(
    () =>
      models.map((model, index) => {
        const family = families[model.slug];
        const point = family?.points.find((item) => item.slug === model.slug);
        return { model, index, family, point };
      }),
    [models, families],
  );
  const comparedPoints = compared.flatMap((entry) => (entry.point ? [entry.point] : []));
  const scores = SCORE_ORDER.filter((value) => comparedPoints.some((point) => point.scores[value] != null));
  const score = scores.includes(chosenScore) ? chosenScore : (scores[0] ?? "intelligence");
  const plottable = (axis: TradeoffAxis) =>
    comparedPoints.filter((point) => point.axes[axis] != null && point.scores[score] != null).length;

  // Cost per task is the fairest cost, then the index cost, then the token price.
  const axes = AXIS_ORDER.filter((axis) => plottable(axis) > 0);
  const defaultAxis = AXIS_ORDER.find((axis) => plottable(axis) >= Math.min(2, comparedPoints.length)) ?? axes[0] ?? "price";
  const axis = chosenAxis && axes.includes(chosenAxis) ? chosenAxis : defaultAxis;

  const { series, missing } = useMemo(() => {
    const byFamily = new Map<string, ChartSeries>();
    const missingNames: string[] = [];
    for (const { model, index, family, point } of compared) {
      if (!family || !point || point.axes[axis] == null || point.scores[score] == null) {
        missingNames.push(model.name);
        continue;
      }
      const highlight = { id: point.slug, color: seriesColor(index), marker: index };
      const existing = byFamily.get(family.familyKey);
      if (existing) {
        existing.highlights.push(highlight);
        continue;
      }
      byFamily.set(family.familyKey, {
        id: family.familyKey,
        label: family.familyName,
        color: seriesColor(index),
        highlights: [highlight],
        points: family.points.flatMap((item) => {
          const x = item.axes[axis];
          const y = item.scores[score];
          return x == null || y == null ? [] : [{ id: item.slug, name: item.name, tag: pointTag(item, t), x, y }];
        }),
      });
    }
    return { series: [...byFamily.values()], missing: missingNames };
  }, [compared, axis, score, t]);

  // Without any scored model there is nothing to trade off.
  if (scores.length === 0 || axes.length === 0) return null;

  return (
    <section className="min-w-0 space-y-4 rounded-xl border bg-card p-4 sm:p-6" aria-labelledby="comparison-tradeoff-title">
      <div className="flex flex-col gap-3">
        <div className="min-w-0">
          <h2 id="comparison-tradeoff-title" className="text-base font-semibold">{copy.compareTitle}</h2>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">{copy.compareHint}</p>
        </div>
        <TradeoffControls
          axis={axis}
          axes={axes}
          onAxis={setChosenAxis}
          score={score}
          scores={scores}
          onScore={setScore}
          scale={scale}
          onScale={setScale}
        />
      </div>
      <TradeoffChart
        series={series}
        title={copy.compareTitle}
        xLabel={copy.axes[axis]}
        yLabel={copy.scores[score]}
        formatX={(value) => formatAxis(axis, value, lang)}
        formatY={(value) => formatScore(value, lang)}
        better={AXIS_BETTER[axis]}
        scale={scale}
        efficientLabel={copy.efficient}
        onSelectPoint={(seriesId, pointId) => {
          const owner = series.find((entry) => entry.id === seriesId)?.highlights[0];
          if (owner) onSelectVariant(owner.id, pointId);
        }}
        selectHint={copy.selectVariant}
        empty={copy.empty}
      />
      {missing.length > 0 && <p className="text-xs text-muted-foreground">{copy.missing(missing.join(", "))}</p>}
    </section>
  );
}
