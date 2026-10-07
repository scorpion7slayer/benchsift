import type { ReactNode, Ref } from "react";

/**
 * Pixel-art helpers for the error scenes. Sprites are rows of characters; each
 * character maps to a class that sets its fill, so the palette follows the theme.
 */

type Palette = Record<string, string>;

/** One rect per horizontal run of the same character keeps the markup small. */
export function Sprite({ rows, palette, x = 0, y = 0, scale = 1 }: { rows: readonly string[]; palette: Palette; x?: number; y?: number; scale?: number }) {
  const rects: ReactNode[] = [];
  rows.forEach((row, r) => {
    let c = 0;
    while (c < row.length) {
      const char = row[c];
      let end = c + 1;
      while (end < row.length && row[end] === char) end++;
      // An empty class leaves the fill to the parent group.
      if (char in palette) {
        rects.push(<rect key={`${r}-${c}`} x={x + c * scale} y={y + r * scale} width={(end - c) * scale} height={scale} className={palette[char] || undefined} />);
      }
      c = end;
    }
  });
  return <>{rects}</>;
}

const DIGITS: Record<string, readonly string[]> = {
  "0": [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  "3": ["####.", "....#", "....#", ".###.", "....#", "....#", "####."],
  "4": ["#..#.", "#..#.", "#..#.", "#####", "...#.", "...#.", "...#."],
  "5": ["#####", "#....", "####.", "....#", "....#", "....#", "####."],
  "2": [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"],
  "9": [".###.", "#...#", "#...#", ".####", "....#", "#...#", ".###."],
};

/** Digit cells are 3 units, so one digit is 15 × 21 units. */
export const DIGIT_SCALE = 3;
export const DIGIT_WIDTH = 5 * DIGIT_SCALE;
export const DIGIT_HEIGHT = 7 * DIGIT_SCALE;

export function Digit({ value, x, y, className = "" }: { value: string; x: number; y: number; className?: string }) {
  return <Sprite rows={DIGITS[value]} palette={{ "#": className }} x={x} y={y} scale={DIGIT_SCALE} />;
}

type Key = readonly [at: number, value: string, ease?: string];

const round = (value: number) => Math.round(value * 1000) / 1000;

function frames(total: number, keys: readonly Key[]): Key[] {
  const list = [...keys];
  if (list[0][0] > 0) list.unshift([0, list[0][1]]);
  if (list[list.length - 1][0] < total) list.push([total, list[list.length - 1][1]]);
  return list;
}

/** `"*"` as the property means each value is a full declaration list. */
const declare = (property: string, value: string) => (property === "*" ? value : `${property}:${value}`);

/** Keyframes from timestamped values (ms); each key may set the easing of the segment it starts. */
export function keyframes(name: string, total: number, property: string, keys: readonly Key[]): string {
  const body = frames(total, keys)
    .map(([at, value, ease]) => `${round((at / total) * 100)}%{${declare(property, value)}${ease ? `;animation-timing-function:${ease}` : ""}}`)
    .join("");
  return `@keyframes ${name}{${body}}`;
}

/**
 * One animated property. A one-shot track rests on its last value and a loop on
 * its first, which is also what reduced motion shows.
 */
export function track(
  selector: string,
  name: string,
  total: number,
  property: string,
  keys: readonly Key[],
  options: { delay?: number; repeat?: boolean; rest?: string } = {},
): string {
  const list = frames(total, keys);
  const timing = `${total}ms linear ${options.delay ?? 0}ms ${options.repeat ? "infinite" : "1 both"}`;
  const rest = options.rest ?? (options.repeat ? list[0][1] : list[list.length - 1][1]);
  return `${keyframes(name, total, property, list)}${selector}{${declare(property, rest)};animation:${name} ${timing}}`;
}

export const translate = (x: number, y: number) => `translate(${round(x)}px,${round(y)}px)`;

/** Rotation or scale about a pivot, written so keyframes interpolate cleanly. */
export const pivot = (x: number, y: number, inner: string) => `translate(${round(x)}px,${round(y)}px) ${inner} translate(${round(-x)}px,${round(-y)}px)`;

export const EASE_OUT = "cubic-bezier(0.22,1,0.36,1)";
export const EASE_IN = "cubic-bezier(0.55,0,1,0.45)";
export const EASE_IN_OUT = "cubic-bezier(0.65,0,0.35,1)";

/** Scene frame shared by the error pages and the page cats. */
export function PixelScene({
  width,
  height,
  css,
  children,
  className,
  unit,
  ref,
}: {
  width: number;
  height: number;
  css: string;
  children: ReactNode;
  className?: string;
  /** Fixed CSS pixels per unit; by default the scene fills its container's width. */
  unit?: number;
  ref?: Ref<SVGSVGElement>;
}) {
  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${width} ${height}`}
      className={`px-scene ${className ?? ""}`}
      style={unit ? { width: width * unit, height: height * unit } : undefined}
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
    >
      {/* Static, generated at module load; never contains user input. Inside
          SVG, "<" would open a tag, so these rules avoid it. */}
      <style dangerouslySetInnerHTML={{ __html: css }} />
      {children}
    </svg>
  );
}
