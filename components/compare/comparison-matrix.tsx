import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { InfoTip } from "@/components/info-tip";
import type { LLMModel } from "@/lib/model-types";
import { bestComparisonValue } from "@/lib/comparison-rows";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { ComparisonCell } from "./comparison-cell";
import { ComparedModel } from "./compared-model";
import type { RowSection } from "./row-sections";

/**
 * Desktop table: model identities stay pinned under the site header while the
 * measurements scroll, and every value cell lines up under its model.
 */
export function ComparisonMatrix({
  models,
  sections,
  viewKey,
  pending,
  leaving,
  fresh,
  addColumn,
  onRemove,
  empty,
}: {
  models: LLMModel[];
  sections: RowSection[];
  viewKey: string;
  pending: boolean;
  leaving: string | null;
  fresh: string | null;
  addColumn: ReactNode | null;
  onRemove: (slug: string) => void;
  empty: string;
}) {
  const { t } = useI18n();
  const sentinel = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const element = sentinel.current;
    if (!element) return;
    // The sentinel leaves the viewport exactly when the header row becomes pinned.
    const observer = new IntersectionObserver(([entry]) => setStuck(!entry.isIntersecting), {
      rootMargin: "-58px 0px 0px 0px",
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const columnState = (slug: string) =>
    cn(slug === leaving && "compare-column-leaving", slug === fresh && "compare-column-fresh");
  const columnCount = models.length + 1 + (addColumn ? 1 : 0);

  return (
    <div className="hidden lg:block">
      <div ref={sentinel} aria-hidden="true" />
      <table
        aria-busy={pending}
        data-stuck={stuck || undefined}
        className="compare-matrix w-full table-fixed border-separate border-spacing-0 text-sm"
      >
        <caption className="sr-only">{t.compare.title}</caption>
        <colgroup>
          <col className="w-52 xl:w-60" />
          {models.map((model) => <col key={model.slug} />)}
          {addColumn && <col className="w-56 xl:w-64" />}
        </colgroup>
        <thead>
          <tr>
            <th scope="col" className="compare-sticky-head rounded-tl-xl border-y border-l pl-4 text-left text-xs font-medium text-muted-foreground">
              {t.compareWorkspace.metrics}
            </th>
            {models.map((model, index) => (
              <th
                key={model.slug}
                scope="col"
                className={cn("compare-sticky-head border-y border-l px-4 text-left font-normal", !addColumn && index === models.length - 1 && "rounded-tr-xl border-r", columnState(model.slug))}
              >
                <ComparedModel model={model} index={index} disabled={pending} onRemove={() => onRemove(model.slug)} />
              </th>
            ))}
            {addColumn && (
              <th scope="col" className="compare-sticky-head rounded-tr-xl border-y border-x px-4 text-left font-normal">
                {addColumn}
              </th>
            )}
          </tr>
        </thead>
        <tbody key={viewKey} className="compare-metrics-enter">
          {sections.map((section) => (
            <Fragment key={section.key}>
              {section.title && (
                <tr>
                  <th
                    colSpan={columnCount}
                    scope="colgroup"
                    className="border-l border-r border-b bg-muted/40 px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    {section.title}
                  </th>
                </tr>
              )}
              {section.rows.map((row) => {
                const best = bestComparisonValue(row);
                return (
                  <tr key={row.id} className="group/row">
                    <th scope="row" className="border-b border-l bg-card py-3 pl-4 pr-3 text-left align-top text-xs font-normal leading-5 text-muted-foreground transition-colors group-hover/row:bg-muted/30">
                      <span className="inline-flex items-center gap-1">
                        {row.label}
                        {row.hint && <InfoTip label={`${t.glossary.infoLabel} · ${row.label}`} content={row.hint} />}
                      </span>
                    </th>
                    {row.values.map((value, index) => (
                      <td
                        key={models[index].slug}
                        className={cn(
                          "border-b border-l bg-card px-4 py-3 align-top transition-colors group-hover/row:bg-muted/30",
                          !addColumn && index === models.length - 1 && "border-r",
                          columnState(models[index].slug),
                        )}
                      >
                        <ComparisonCell row={row} value={value} best={best} />
                      </td>
                    ))}
                    {addColumn && <td className="border-b border-x bg-card group-hover/row:bg-muted/30" />}
                  </tr>
                );
              })}
            </Fragment>
          ))}
          {sections.length === 0 && (
            <tr>
              <td colSpan={columnCount} className="border-x border-b bg-card p-8 text-center text-sm text-muted-foreground">
                <span role="status">{empty}</span>
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <div aria-hidden="true" className="h-3 rounded-b-xl border-x border-b bg-card" />
    </div>
  );
}
