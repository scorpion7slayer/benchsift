import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { ModelMarker } from "@/components/compare/compared-model";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export interface ChartPoint {
  id: string;
  /** Full configuration name, read in the tooltip. */
  name: string;
  /** Short configuration tag drawn in small capitals, e.g. "MAX". */
  tag: string | null;
  x: number;
  y: number;
}

export interface ChartHighlight {
  id: string;
  color: string;
  /** Zero-based column number in the comparison, when there is one. */
  marker?: number;
}

/** A line through the reasoning levels of one model family. */
export interface ChartSeries {
  id: string;
  label: string;
  color: string;
  points: ChartPoint[];
  highlights: ChartHighlight[];
}

export type ChartScale = "linear" | "log";

const MARGIN = { top: 40, right: 16, bottom: 56, left: 44 };
const LABEL_HEIGHT = 30;
const POINT_GAP = 10;

interface Box { x: number; y: number; width: number; height: number }

function overlaps(a: Box, b: Box): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

/** A round step (1, 2 or 5 × 10ⁿ) giving about `count` intervals. */
function niceStep(span: number, count: number): number {
  const raw = span / count;
  const power = 10 ** Math.floor(Math.log10(raw));
  const unit = raw / power;
  return (unit <= 1.5 ? 1 : unit <= 3 ? 2 : unit <= 7 ? 5 : 10) * power;
}

function linearTicks(max: number, count: number): { max: number; ticks: number[] } {
  if (max <= 0) return { max: 1, ticks: [0, 1] };
  const step = niceStep(max, count);
  const top = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let value = 0; value <= top + step / 2; value += step) ticks.push(Number(value.toPrecision(12)));
  return { max: top, ticks };
}

/** Round values (1, 2, 5 × 10ⁿ) between the nearest ones around the data. */
function logTicks(min: number, max: number): { min: number; max: number; ticks: number[] } {
  const steps: number[] = [];
  for (let power = Math.floor(Math.log10(min)) - 1; power <= Math.ceil(Math.log10(max)) + 1; power += 1) {
    for (const unit of [1, 2, 5]) steps.push(Number((unit * 10 ** power).toPrecision(12)));
  }
  const low = [...steps].reverse().find((value) => value <= min) ?? steps[0];
  const high = steps.find((value) => value >= max * 1.0001) ?? steps[steps.length - 1];
  const inside = steps.filter((value) => value >= low && value <= high);
  // Many ticks: keep the decades and the bounds.
  const ticks = inside.length <= 7 ? inside : inside.filter((value, index) => index === 0 || index === inside.length - 1 || Math.log10(value) % 1 === 0);
  return { min: low, max: high, ticks };
}

/** Approximate rendered width of a label, enough to keep labels apart. */
function textWidth(text: string, size: number, mono = false): number {
  return text.length * size * (mono ? 0.62 : 0.56);
}

function useWidth(fallback: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(fallback);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = () => setWidth(Math.max(280, Math.round(element.getBoundingClientRect().width)));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

/**
 * Score against cost (or speed) with one line per model family, in the style
 * of the DeepSWE and Artificial Analysis charts: the x axis runs so that the
 * most efficient corner is always the top right, and each family is named
 * directly on the chart. Points are reachable with the keyboard as a single
 * stop: arrow keys move between them, Enter selects one. With `picker`, the
 * reader chooses which series to draw, from none to all, and the axes fit
 * the series shown so a crowded corner can be spread out.
 */
export function TradeoffChart({
  series,
  title,
  xLabel,
  yLabel,
  formatX,
  formatY,
  better,
  scale = "linear",
  efficientLabel,
  labelMode = "series",
  onSelectPoint,
  selectHint,
  empty,
  legend = true,
  picker = false,
  className,
}: {
  series: ChartSeries[];
  title: string;
  xLabel: string;
  yLabel: string;
  formatX: (value: number) => string;
  formatY: (value: number) => string;
  /** Whether a lower or a higher x value is better; lower runs right to left. */
  better: "lower" | "higher";
  scale?: ChartScale;
  efficientLabel: string;
  /** "series" names each family at its highlighted point; "points" tags every point. */
  labelMode?: "series" | "points";
  onSelectPoint?: (seriesId: string, pointId: string) => void;
  /** Read after a selectable point's values, e.g. "Select to compare this level". */
  selectHint?: string;
  empty: string;
  /** Shows the list of highlighted points below the chart ("series" labels only). */
  legend?: boolean;
  /** Lists every series below the chart so the reader can show or hide each one. */
  picker?: boolean;
  className?: string;
}) {
  const { t } = useI18n();
  const [wrapper, width] = useWidth(720);
  const [active, setActive] = useState<{ series: string; point: string } | null>(null);
  const [focusIndex, setFocusIndex] = useState(0);
  const pointRefs = useRef(new Map<string, SVGGElement>());
  const [hoveredSeries, setHoveredSeries] = useState<string | null>(null);
  // Hidden rather than shown ids, so series that appear later (a cleared
  // search, another axis) are drawn until the reader hides them.
  const [hidden, setHidden] = useState<ReadonlySet<string>>(() => new Set());
  // Once the reader has picked series, a series shown again appears at once
  // instead of waiting for its place in the opening animation.
  const [picked, setPicked] = useState(false);

  const drawable = useMemo(
    () =>
      series
        .map((entry) => ({
          ...entry,
          points: entry.points
            .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y) && point.y >= 0 && (scale === "log" ? point.x > 0 : point.x >= 0))
            .sort((a, b) => a.x - b.x || a.y - b.y),
        }))
        .filter((entry) => entry.points.length > 0),
    [series, scale],
  );
  const plotted = useMemo(
    () => (picker ? drawable.filter((entry) => !hidden.has(entry.id)) : drawable),
    [drawable, hidden, picker],
  );
  const allPoints = plotted.flatMap((entry) => entry.points);

  const height = width < 520 ? 320 : Math.round(Math.min(460, Math.max(340, width * 0.5)));
  const plotWidth = width - MARGIN.left - MARGIN.right;
  const plotHeight = height - MARGIN.top - MARGIN.bottom;

  const maxY = Math.max(1, ...allPoints.map((point) => point.y));
  const yAxis = linearTicks(maxY * 1.08, height < 360 ? 5 : 6);
  const xValues = allPoints.map((point) => point.x);
  const xAxis = scale === "log" && xValues.length
    ? logTicks(Math.min(...xValues), Math.max(...xValues))
    : { min: 0, ...linearTicks(Math.max(0, ...xValues) * 1.06, width < 520 ? 3 : 5) };
  const project = (value: number) => (scale === "log" ? Math.log10(value) : value);
  const xFraction = (value: number) => (project(value) - project(xAxis.min)) / (project(xAxis.max) - project(xAxis.min) || 1);
  const xPos = (value: number) => MARGIN.left + plotWidth * (better === "lower" ? 1 - xFraction(value) : xFraction(value));
  const yPos = (value: number) => MARGIN.top + plotHeight * (1 - value / yAxis.max);
  // On a narrow chart, a tick too close to the last one kept would print over it.
  const xTicks: number[] = [];
  let lastTickAt = -Infinity;
  for (const tick of [...xAxis.ticks].sort((a, b) => xPos(a) - xPos(b))) {
    if (xPos(tick) - lastTickAt < 52) continue;
    xTicks.push(tick);
    lastTickAt = xPos(tick);
  }

  // One keyboard stop for the whole chart; arrows walk the points in order.
  // Visual order: on a reversed axis, the next point to the right has a lower x.
  const order = plotted.flatMap((entry) => {
    const points = better === "lower" ? [...entry.points].reverse() : entry.points;
    return points.map((point) => ({ series: entry.id, point: point.id }));
  });
  const keyOf = (seriesId: string, pointId: string) => `${seriesId}\u0000${pointId}`;
  const safeFocus = Math.min(focusIndex, Math.max(0, order.length - 1));

  useEffect(() => {
    if (!active) return;
    const close = (event: PointerEvent) => {
      if (!wrapper.current?.contains(event.target as Node)) setActive(null);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [active, wrapper]);

  if (drawable.length === 0) {
    return <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">{empty}</p>;
  }

  function pickSeries(update: (hidden: ReadonlySet<string>) => ReadonlySet<string>) {
    setPicked(true);
    setHidden(update);
  }

  function moveFocus(event: KeyboardEvent<SVGSVGElement>) {
    const steps: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    let next = safeFocus;
    if (event.key in steps) next = (safeFocus + steps[event.key] + order.length) % order.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = order.length - 1;
    else if (event.key === "Escape") return setActive(null);
    else return;
    event.preventDefault();
    setFocusIndex(next);
    const target = order[next];
    setActive(target);
    pointRefs.current.get(keyOf(target.series, target.point))?.focus();
  }

  // Labels: one per highlighted point ("series") or one per point ("points"),
  // placed around the point where they do not collide with earlier labels.
  const placed: Box[] = [];
  const labels: Array<{ key: string; box: Box; anchor: "start" | "middle" | "end"; title: string | null; tag: string | null; color: string }> = [];
  const pointBoxes = allPoints.map((point) => ({ x: xPos(point.x) - 5, y: yPos(point.y) - 5, width: 10, height: 10 }));
  const bounds = { left: MARGIN.left + 2, right: width - MARGIN.right, top: MARGIN.top - 8, bottom: MARGIN.top + plotHeight - 4 };
  const place = (key: string, px: number, py: number, title: string | null, tag: string | null, color: string, force = false) => {
    const boxWidth = Math.max(title ? textWidth(title, 13) : 0, tag ? textWidth(tag, 10, true) : 0) + 4;
    const boxHeight = title && tag ? LABEL_HEIGHT : 16;
    const at = (x: number, y: number, anchor: "start" | "middle" | "end") => ({ box: { x, y, width: boxWidth, height: boxHeight }, anchor });
    const above = py - POINT_GAP - boxHeight;
    const below = py + POINT_GAP;
    const candidates = [
      at(px - boxWidth / 2, above, "middle"),
      at(px + POINT_GAP, py - boxHeight / 2, "start"),
      at(px - POINT_GAP - boxWidth, py - boxHeight / 2, "end"),
      at(px - boxWidth / 2, below, "middle"),
      // Corners, then one line further out, before giving up on a clear spot.
      at(px + POINT_GAP / 2, above, "start"),
      at(px - POINT_GAP / 2 - boxWidth, above, "end"),
      at(px + POINT_GAP / 2, below, "start"),
      at(px - POINT_GAP / 2 - boxWidth, below, "end"),
      at(px - boxWidth / 2, above - boxHeight, "middle"),
      at(px - boxWidth / 2, below + boxHeight, "middle"),
    ];
    const fits = (box: Box) => box.x >= bounds.left && box.x + box.width <= bounds.right && box.y >= bounds.top && box.y + box.height <= bounds.bottom;
    const clearOfLabels = (box: Box) => !placed.some((other) => overlaps(box, other));
    const clear = (box: Box) => clearOfLabels(box) && !pointBoxes.some((other) => overlaps(box, other));
    // A priority label may cover other points, never another label or the frame.
    const choice = candidates.find(({ box }) => fits(box) && clear(box))
      ?? (force ? candidates.find(({ box }) => fits(box) && clearOfLabels(box)) : undefined);
    if (!choice) return;
    placed.push(choice.box);
    labels.push({ key, ...choice, title, tag, color });
  };
  // Series come in priority order (best first): the first ones keep a name
  // wherever text still fits (three on a phone, six otherwise); later ones are
  // skipped when crowded (the tooltip and the picker still name them).
  const priorityLabels = width < 520 ? 3 : 6;
  for (const [seriesIndex, entry] of plotted.entries()) {
    if (labelMode === "series") {
      for (const highlight of entry.highlights) {
        const point = entry.points.find((item) => item.id === highlight.id);
        if (point) place(`${entry.id}-${point.id}`, xPos(point.x), yPos(point.y), entry.label, point.tag, highlight.color, seriesIndex < priorityLabels);
      }
    } else {
      // Highlighted points claim their place first.
      const ordered = [...entry.points].sort((a, b) => Number(entry.highlights.some((h) => h.id === b.id)) - Number(entry.highlights.some((h) => h.id === a.id)));
      for (const point of ordered) place(`${entry.id}-${point.id}`, xPos(point.x), yPos(point.y), null, point.tag, entry.color);
    }
  }

  const activeEntry = active ? plotted.find((entry) => entry.id === active.series) : undefined;
  const activePoint = activeEntry?.points.find((point) => point.id === active?.point);
  // A hidden series has nothing to bring forward, so hovering it dims nothing.
  const dimmedExcept = (hoveredSeries && plotted.some((entry) => entry.id === hoveredSeries) ? hoveredSeries : null) ?? active?.series ?? null;
  const describe = (point: ChartPoint) =>
    `${point.name}${point.tag && !point.name.includes(point.tag) ? ` (${point.tag})` : ""}: ${yLabel} ${formatY(point.y)}, ${xLabel} ${formatX(point.x)}`;
  const highlightsWithPoints = plotted.flatMap((entry) =>
    entry.highlights.flatMap((highlight) => {
      const point = entry.points.find((item) => item.id === highlight.id);
      return point ? [{ entry, highlight, point }] : [];
    }),
  );

  return (
    <div className={cn("min-w-0", className)}>
      <div ref={wrapper} className="relative">
        {plotted.length === 0 ? (
          <p role="status" className="flex items-center justify-center rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground" style={{ height }}>
            {t.tradeoff.picker.none}
          </p>
        ) : (
          <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            className="block max-w-full overflow-visible"
            role="group"
            aria-label={`${title}. ${yLabel} / ${xLabel}.`}
            onKeyDown={moveFocus}
          >
            {/* Axis titles: the score reads across the top, like a chart heading. */}
            <text x={MARGIN.left - 36} y={16} className="fill-foreground text-[13px] font-semibold">{yLabel}</text>
            <text x={width - MARGIN.right} y={16} textAnchor="end" className="fill-muted-foreground text-[12px] italic">{efficientLabel}</text>
            <text x={MARGIN.left + plotWidth / 2} y={height - 8} textAnchor="middle" className="fill-foreground text-[12px] font-medium">{xLabel}</text>

            <g aria-hidden="true">
              {yAxis.ticks.map((tick) => (
                <g key={`y-${tick}`}>
                  <line x1={MARGIN.left} x2={width - MARGIN.right} y1={yPos(tick)} y2={yPos(tick)} stroke="var(--border)" strokeWidth={tick === 0 ? 1.25 : 1} />
                  <text x={MARGIN.left - 8} y={yPos(tick) + 4} textAnchor="end" className="fill-muted-foreground text-[11px] tabular-nums">{formatY(tick)}</text>
                </g>
              ))}
              {xTicks.map((tick) => (
                <g key={`x-${tick}`}>
                  <line x1={xPos(tick)} x2={xPos(tick)} y1={MARGIN.top} y2={MARGIN.top + plotHeight} stroke="var(--border)" strokeOpacity={0.6} />
                  <text x={xPos(tick)} y={MARGIN.top + plotHeight + 18} textAnchor="middle" className="fill-muted-foreground text-[11px] tabular-nums">{formatX(tick)}</text>
                </g>
              ))}
            </g>

            {activePoint && (
              <g aria-hidden="true" className="text-foreground/40">
                <line x1={xPos(activePoint.x)} x2={xPos(activePoint.x)} y1={yPos(activePoint.y)} y2={MARGIN.top + plotHeight} stroke="currentColor" strokeDasharray="3 4" />
                <line x1={MARGIN.left} x2={xPos(activePoint.x)} y1={yPos(activePoint.y)} y2={yPos(activePoint.y)} stroke="currentColor" strokeDasharray="3 4" />
              </g>
            )}

            {plotted.map((entry, seriesIndex) => {
              const dimmed = dimmedExcept !== null && dimmedExcept !== entry.id;
              const path = entry.points.map((point, index) => `${index ? "L" : "M"}${xPos(point.x).toFixed(1)} ${yPos(point.y).toFixed(1)}`).join(" ");
              return (
                <g key={entry.id} className="tradeoff-series" data-dimmed={dimmed || undefined} style={{ "--series-delay": `${picked ? 0 : seriesIndex * 90}ms` } as React.CSSProperties}>
                  {entry.points.length > 1 && (
                    <path d={path} pathLength={1} fill="none" stroke={entry.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" className="tradeoff-line" />
                  )}
                  {entry.points.map((point, pointIndex) => {
                    const highlight = entry.highlights.find((item) => item.id === point.id);
                    const index = order.findIndex((item) => item.series === entry.id && item.point === point.id);
                    const isActive = active?.series === entry.id && active.point === point.id;
                    const selectable = Boolean(onSelectPoint) && !highlight;
                    return (
                      <g
                        key={point.id}
                        ref={(element) => {
                          const key = keyOf(entry.id, point.id);
                          if (element) pointRefs.current.set(key, element);
                          else pointRefs.current.delete(key);
                        }}
                        role={selectable ? "button" : "img"}
                        tabIndex={index === safeFocus ? 0 : -1}
                        aria-label={`${describe(point)}${selectable && selectHint ? `. ${selectHint}` : ""}`}
                        aria-current={highlight ? "true" : undefined}
                        className={cn("tradeoff-point outline-none", selectable && "cursor-pointer")}
                        style={{ "--point-delay": `${(picked ? 0 : seriesIndex * 90 + 220) + pointIndex * 40}ms` } as React.CSSProperties}
                        onPointerEnter={() => setActive({ series: entry.id, point: point.id })}
                        onPointerLeave={() => setActive((current) => (current?.series === entry.id && current.point === point.id ? null : current))}
                        onFocus={() => {
                          setFocusIndex(index);
                          setActive({ series: entry.id, point: point.id });
                        }}
                        onBlur={() => setActive(null)}
                        onClick={() => selectable && onSelectPoint?.(entry.id, point.id)}
                        onKeyDown={(event) => {
                          if (selectable && (event.key === "Enter" || event.key === " ")) {
                            event.preventDefault();
                            onSelectPoint?.(entry.id, point.id);
                          }
                        }}
                      >
                        <circle cx={xPos(point.x)} cy={yPos(point.y)} r={14} fill="transparent" />
                        <circle
                          cx={xPos(point.x)}
                          cy={yPos(point.y)}
                          r={highlight ? 5.5 : 3.75}
                          fill={highlight?.color ?? entry.color}
                          stroke="var(--card)"
                          strokeWidth={highlight ? 2.5 : 1.5}
                          className={cn("tradeoff-dot", isActive && "is-active")}
                        />
                      </g>
                    );
                  })}
                </g>
              );
            })}

            <g aria-hidden="true" className="tradeoff-labels">
              {labels.map((label) => {
                const x = label.anchor === "middle" ? label.box.x + label.box.width / 2 : label.anchor === "start" ? label.box.x : label.box.x + label.box.width;
                const series = plotted.find((entry) => label.key.startsWith(`${entry.id}-`));
                const dimmed = dimmedExcept !== null && series && dimmedExcept !== series.id;
                return (
                  <g key={label.key} className="transition-opacity duration-150" opacity={dimmed ? 0.25 : 1}>
                    {label.title && (
                      <text x={x} y={label.box.y + 12} textAnchor={label.anchor} fill={label.color} className="text-[13px] font-semibold [paint-order:stroke] [stroke:var(--card)] [stroke-width:3px]">
                        {label.title}
                      </text>
                    )}
                    {label.tag && (
                      <text
                        x={x}
                        y={label.box.y + (label.title ? 26 : 11)}
                        textAnchor={label.anchor}
                        fill={label.color}
                        className="font-mono text-[10px] uppercase tracking-wide opacity-75 [paint-order:stroke] [stroke:var(--card)] [stroke-width:3px]"
                      >
                        {label.tag}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
        )}

        {activeEntry && activePoint && (
          <div
            role="presentation"
            className="tradeoff-tooltip pointer-events-none absolute z-10 w-max max-w-[16rem] rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md"
            style={{
              left: Math.min(Math.max(xPos(activePoint.x), 90), width - 90),
              top: yPos(activePoint.y),
              transform: yPos(activePoint.y) < MARGIN.top + 90 ? "translate(-50%, 16px)" : "translate(-50%, calc(-100% - 14px))",
            }}
          >
            <p className="font-medium leading-snug">{activePoint.name}</p>
            <dl className="mt-1 grid grid-cols-[auto_auto] gap-x-3 gap-y-0.5 tabular-nums text-muted-foreground">
              <dt>{yLabel}</dt><dd className="text-right font-medium text-foreground">{formatY(activePoint.y)}</dd>
              <dt>{xLabel}</dt><dd className="text-right font-medium text-foreground">{formatX(activePoint.x)}</dd>
            </dl>
            {onSelectPoint && selectHint && !activeEntry.highlights.some((item) => item.id === activePoint.id) && (
              <p className="mt-1.5 border-t pt-1.5 text-muted-foreground">{selectHint}</p>
            )}
          </div>
        )}
      </div>

      {picker && (
        <SeriesPicker
          series={drawable}
          hidden={hidden}
          onChange={pickSeries}
          onPreview={setHoveredSeries}
        />
      )}

      {labelMode === "series" && legend && (
        <ul className="mt-3 grid gap-x-4 gap-y-1 text-xs sm:grid-cols-2">
          {highlightsWithPoints.map(({ entry, highlight, point }) => (
            <li
              key={`${entry.id}-${point.id}`}
              onPointerEnter={() => setHoveredSeries(entry.id)}
              onPointerLeave={() => setHoveredSeries(null)}
              className="flex min-w-0 items-center gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-muted/60"
            >
              <span aria-hidden="true" className="h-0.5 w-4 shrink-0 rounded-full" style={{ background: entry.color }} />
              {highlight.marker != null && <ModelMarker index={highlight.marker} color={highlight.color} className="size-4 text-[10px]" />}
              <span className="min-w-0 truncate font-medium" title={point.name}>{point.name}</span>
              <span className="ml-auto shrink-0 tabular-nums text-muted-foreground">{formatY(point.y)} · {formatX(point.x)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * One toggle per series, in the chart's priority order. Hovering or focusing
 * a series brings it forward on the chart, which names the points of a
 * crowded corner without having to reach them.
 */
function SeriesPicker({
  series,
  hidden,
  onChange,
  onPreview,
}: {
  series: Array<Pick<ChartSeries, "id" | "label" | "color">>;
  hidden: ReadonlySet<string>;
  /** Takes an update, so quick successive toggles all apply. */
  onChange: (update: (hidden: ReadonlySet<string>) => ReadonlySet<string>) => void;
  onPreview: (id: string | null) => void;
}) {
  const { t, lang } = useI18n();
  const copy = t.tradeoff.picker;
  const headingId = useId();
  const shown = series.filter((entry) => !hidden.has(entry.id)).length;
  const toggle = (id: string) =>
    onChange((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  return (
    <div className="mt-4 border-t pt-3">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <p id={headingId} className="text-xs font-medium">
            {copy.title}
            <span className="ml-2 font-normal tabular-nums text-muted-foreground" aria-live="polite">
              {copy.count(shown.toLocaleString(lang), series.length.toLocaleString(lang))}
            </span>
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">{copy.hint}</p>
        </div>
        <div className="flex gap-1">
          <Button type="button" variant="outline" size="sm" onClick={() => onChange(() => new Set())}>
            {copy.showAll}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => onChange(() => new Set(series.map((entry) => entry.id)))}>
            {copy.hideAll}
          </Button>
        </div>
      </div>
      <ul aria-labelledby={headingId} className="mt-3 flex max-h-56 flex-wrap gap-1.5 overflow-y-auto sm:max-h-none sm:overflow-visible">
        {series.map((entry) => {
          const visible = !hidden.has(entry.id);
          return (
            <li key={entry.id} className="min-w-0 max-w-full">
              <button
                type="button"
                aria-pressed={visible}
                onClick={() => toggle(entry.id)}
                onPointerEnter={() => onPreview(entry.id)}
                onPointerLeave={() => onPreview(null)}
                onFocus={() => onPreview(entry.id)}
                onBlur={() => onPreview(null)}
                className={cn(
                  "flex h-7 max-w-full items-center gap-1.5 rounded-md border px-2 text-xs transition-colors duration-150 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  // Same weight in both states, so toggling never moves the next toggles.
                  visible ? "bg-background text-foreground" : "border-dashed text-muted-foreground",
                )}
              >
                <span
                  aria-hidden="true"
                  className="size-2.5 shrink-0 rounded-full border-[1.5px]"
                  style={{ borderColor: entry.color, background: visible ? entry.color : "transparent" }}
                />
                <span className="truncate">{entry.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
