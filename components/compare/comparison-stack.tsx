import { InfoTip } from "@/components/info-tip";
import type { LLMModel } from "@/lib/model-types";
import { bestComparisonValue } from "@/lib/comparison-rows";
import { useI18n } from "@/lib/i18n";
import { ComparisonCell } from "./comparison-cell";
import { ModelMarker } from "./compared-model";
import type { RowSection } from "./row-sections";

/**
 * Below the desktop breakpoint each measurement becomes a block listing the
 * models by their number, so nothing depends on horizontal scrolling.
 */
export function ComparisonStack({
  models,
  sections,
  viewKey,
  pending,
  empty,
}: {
  models: LLMModel[];
  sections: RowSection[];
  viewKey: string;
  pending: boolean;
  empty: string;
}) {
  const { t } = useI18n();
  if (sections.length === 0) {
    return <p role="status" className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground lg:hidden">{empty}</p>;
  }
  return (
    <div key={viewKey} aria-busy={pending} className="compare-metrics-enter space-y-5 lg:hidden">
      {sections.map((section) => (
        <section key={section.key} className="space-y-2" aria-label={section.title ?? undefined}>
          {section.title && (
            <h3 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{section.title}</h3>
          )}
          <div className="divide-y overflow-hidden rounded-xl border bg-card">
            {section.rows.map((row) => {
              const best = bestComparisonValue(row);
              return (
                <div key={row.id} className="px-4 py-3">
                  <h4 className="flex items-center gap-1 text-sm font-medium">
                    {row.label}
                    {row.hint && <InfoTip label={`${t.glossary.infoLabel} · ${row.label}`} content={row.hint} />}
                  </h4>
                  <dl className="mt-2 space-y-2.5">
                    {row.values.map((value, index) => (
                      <div key={models[index].slug} className="grid grid-cols-[minmax(0,1fr)_minmax(0,auto)] items-start gap-x-3">
                        <dt className="flex min-w-0 items-center gap-2 pt-0.5 text-xs text-muted-foreground">
                          <ModelMarker index={index} className="size-4 text-[10px]" />
                          <span className="truncate">{models[index].name}</span>
                        </dt>
                        <dd className="min-w-0 max-w-44 text-sm">
                          <ComparisonCell row={row} value={value} best={best} align="end" />
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
