import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Cat, STEP, Star, blinkLoop, swish, type EyeKind } from "./cat";
import { EASE_IN, EASE_IN_OUT, EASE_OUT, PixelScene, Sprite, pivot, track, translate } from "./pixel";

/*
 * A small sitting cat for each page, doing something that fits it. It drops in
 * once, then only loops small gestures; reduced motion shows it at rest.
 */

export type PageCatKind = "home" | "catalog" | "detail" | "compare" | "deepswe" | "agents" | "about" | "reading";

const H = 15;
const UNIT = 2;

const drop = (id: string) =>
  track(`.${id}-in`, `${id}-in`, 560, "*", [
    [0, `transform:${translate(0, -12)};opacity:0`, EASE_IN],
    [340, `transform:${translate(0, 0)};opacity:1`, EASE_OUT],
    [440, `transform:${translate(0, -1.5)};opacity:1`, EASE_IN],
    [560, `transform:${translate(0, 0)};opacity:1`],
  ], { delay: 150 });
const sitting = (id: string) => `.${id}-legs-a,.${id}-legs-b{transform:translate(0px,-3px)}`;
/** `rest` is what reduced motion shows when a loop's first frame would hide something. */
const loop = (selector: string, name: string, period: number, property: string, keys: ReadonlyArray<readonly [number, string, string?]>, rest?: string) =>
  track(selector, name, period, property, keys, { repeat: true, rest });

/** The cat sits facing left at `cx`, its legs tucked under. */
function SittingCat({ id, cx, eyes }: { id: string; cx: number; eyes?: readonly EyeKind[] }) {
  return (
    <g transform={`translate(${cx} ${H + 3}) scale(-1 1)`}>
      <Cat id={id} eyes={eyes} />
    </g>
  );
}

const PAW = { o: "px-cat" };

type Scene = { width: number; css: string; body: ReactNode };

/* Home: peers at the newest models through a magnifying glass. */
const HOME: Scene = {
  width: 30,
  css: [
    drop("pc-home"),
    sitting("pc-home"),
    loop(".pc-home-glass", "pc-home-glass", 3600, "transform", [
      [0, translate(0, 0), STEP],
      [1100, translate(0, 1), STEP],
      [1900, translate(-1, 1), STEP],
      [2700, translate(0, -1), STEP],
      [3300, translate(0, 0)],
    ]),
    loop(".pc-home-glint", "pc-home-glint", 3600, "opacity", [[0, "1", STEP], [1100, "0", STEP], [1400, "1"]]),
    swish("pc-home", 2400),
    blinkLoop("pc-home", 4200),
  ].join(""),
  body: (
    <g className="pc-home-in">
      <SittingCat id="pc-home" cx={17} />
      <g className="pc-home-glass">
        <Sprite rows={[".###...", "#ggg#..", "#g.g#..", "#ggg#..", ".###...", "....#..", ".....#.", "......#"]} palette={{ "#": "px-prop-dark", g: "px-glass" }} x={0} y={1} />
        <rect x="2" y="3" width="1" height="1" className="px-paper pc-home-glint" />
        <Sprite rows={["oo", "oo"]} palette={PAW} x={6} y={8} />
      </g>
    </g>
  ),
};

/* Model directory: pulls the top card off a stack. */
const CATALOG: Scene = {
  width: 31,
  css: [
    drop("pc-catalog"),
    sitting("pc-catalog"),
    loop(".pc-catalog-top", "pc-catalog-top", 3800, "transform", [
      [0, translate(0, 0)],
      [1900, translate(0, 0), EASE_OUT],
      [2150, translate(-3, 0)],
      [2600, translate(-3, 0), EASE_IN_OUT],
      [2850, translate(0, 0)],
    ]),
    loop(".pc-catalog-paw", "pc-catalog-paw", 3800, "transform", [
      [0, translate(0, 0)],
      [1700, translate(0, 0), EASE_OUT],
      [1900, translate(-1, 1)],
      [2150, translate(-4, 1)],
      [2600, translate(-4, 1), EASE_IN_OUT],
      [2950, translate(0, 0)],
    ]),
    swish("pc-catalog", 2600),
    blinkLoop("pc-catalog", 4600),
  ].join(""),
  body: (
    <g className="pc-catalog-in">
      <rect x="1" y="13" width="9" height="2" className="px-paper" />
      <rect x="0" y="11" width="9" height="2" className="px-prop" />
      <g className="pc-catalog-top">
        <rect x="1" y="9" width="9" height="2" className="px-paper" />
        <rect x="2" y="9" width="4" height="1" className="px-prop" />
      </g>
      <SittingCat id="pc-catalog" cx={19} />
      <g className="pc-catalog-paw">
        <Sprite rows={["oo", "oo"]} palette={PAW} x={9} y={8} />
      </g>
    </g>
  ),
};

/* Model page: ticks a checklist, one line at a time. */
const DETAIL: Scene = {
  width: 30,
  css: [
    drop("pc-detail"),
    sitting("pc-detail"),
    ...[0, 1, 2].map((row) =>
      loop(`.pc-detail-c${row}`, `pc-detail-c${row}`, 5200, "opacity", [[0, "0", STEP], [700 + row * 800, "1", STEP], [4500, "0"]], "1"),
    ),
    swish("pc-detail", 2400),
    blinkLoop("pc-detail", 3900),
  ].join(""),
  body: (
    <g className="pc-detail-in">
      <SittingCat id="pc-detail" cx={17} />
      <Sprite
        rows={["...ss...", "dppppppd", "dpbpLLpd", "dppppppd", "dpbpLLpd", "dppppppd", "dpbpLLpd", "dppppppd", "dddddddd"]}
        palette={{ s: "px-prop", d: "px-prop-dark", p: "px-paper", b: "px-prop", L: "px-prop" }}
        x={0}
        y={4}
      />
      {[0, 1, 2].map((row) => (
        <rect key={row} x="2" y={6 + row * 2} width="1" height="1" className={`px-led pc-detail-c${row}`} />
      ))}
      <Sprite rows={["oo", "oo"]} palette={PAW} x={7} y={10} />
    </g>
  ),
};

/* Compare: watches a balance tip from one side to the other. */
const COMPARE: Scene = {
  width: 36,
  css: [
    drop("pc-compare"),
    sitting("pc-compare"),
    loop(".pc-compare-beam", "pc-compare-beam", 4000, "transform", [
      [0, pivot(6.5, 5.5, "rotate(0deg)"), EASE_IN_OUT],
      [1000, pivot(6.5, 5.5, "rotate(8deg)"), EASE_IN_OUT],
      [2000, pivot(6.5, 5.5, "rotate(0deg)"), EASE_IN_OUT],
      [3000, pivot(6.5, 5.5, "rotate(-8deg)"), EASE_IN_OUT],
      [4000, pivot(6.5, 5.5, "rotate(0deg)")],
    ]),
    // Eyes follow the side going down.
    loop(".pc-compare-eyes-open", "pc-compare-eyes", 4000, "transform", [[0, translate(0, 0), STEP], [600, translate(-1, 0), STEP], [2600, translate(1, 0), STEP], [3600, translate(0, 0)]]),
    swish("pc-compare", 2800),
  ].join(""),
  body: (
    <g className="pc-compare-in">
      <rect x="3" y="14" width="7" height="1" className="px-prop-dark" />
      <rect x="6" y="5" width="1" height="9" className="px-prop-dark" />
      <g className="pc-compare-beam">
        <rect x="0" y="5" width="13" height="1" className="px-prop-dark" />
        <rect x="0" y="6" width="1" height="3" className="px-prop" />
        <rect x="3" y="6" width="1" height="3" className="px-prop" />
        <rect x="9" y="6" width="1" height="3" className="px-prop" />
        <rect x="12" y="6" width="1" height="3" className="px-prop" />
        <rect x="0" y="9" width="4" height="1" className="px-prop-dark" />
        <rect x="9" y="9" width="4" height="1" className="px-prop-dark" />
        <rect x="1" y="7" width="2" height="2" className="px-yarn" />
        <rect x="10" y="7" width="2" height="2" className="px-star" />
      </g>
      <SittingCat id="pc-compare" cx={24} />
    </g>
  ),
};

/* DeepSWE: a bug crawls in and the cat pounces on it. */
const DEEPSWE: Scene = {
  width: 43,
  css: [
    drop("pc-deepswe"),
    sitting("pc-deepswe"),
    loop(".pc-deepswe-hop", "pc-deepswe-hop", 9000, "transform", [
      [0, translate(0, 0)],
      [2600, translate(0, 0), EASE_OUT],
      [2800, translate(-6, -6), EASE_IN],
      [3000, translate(-11, 0)],
      [3900, translate(-11, 0), EASE_IN_OUT],
      [4400, translate(0, 0)],
    ]),
    loop(".pc-deepswe-bug", "pc-deepswe-bug", 9000, "*", [
      [0, `transform:${translate(-5, 0)};opacity:1`],
      [2600, `transform:${translate(12, 0)};opacity:1`, STEP],
      [2950, `transform:${translate(12, 0)};opacity:0`, STEP],
      [8800, `transform:${translate(-5, 0)};opacity:0`, STEP],
      [8900, `transform:${translate(-5, 0)};opacity:1`],
    ]),
    loop(".pc-deepswe-buglegs-a", "pc-deepswe-buglegs-a", 240, "opacity", [[0, "1", STEP], [120, "0", STEP], [240, "1"]]),
    loop(".pc-deepswe-buglegs-b", "pc-deepswe-buglegs-b", 240, "opacity", [[0, "0", STEP], [120, "1", STEP], [240, "0"]]),
    loop(".pc-deepswe-fixed", "pc-deepswe-fixed", 9000, "*", [
      [0, "transform:scale(0.4);opacity:0", STEP],
      [2950, "transform:scale(0.4);opacity:1", EASE_OUT],
      [3450, "transform:scale(1.4);opacity:0"],
    ]),
    swish("pc-deepswe", 2200),
    blinkLoop("pc-deepswe", 4400),
  ].join(""),
  body: (
    <g className="pc-deepswe-in">
      <g className="pc-deepswe-bug">
        {/* Red with grey legs, so it shows on both themes. */}
        <Sprite rows={[".ee.", "eeee"]} palette={{ e: "px-alert" }} x={0} y={12} />
        <g className="pc-deepswe-buglegs-a">
          <Sprite rows={["l.l."]} palette={{ l: "px-prop" }} x={0} y={14} />
        </g>
        <g className="pc-deepswe-buglegs-b">
          <Sprite rows={[".l.l"]} palette={{ l: "px-prop" }} x={0} y={14} />
        </g>
      </g>
      <g className="pc-deepswe-hop">
        <SittingCat id="pc-deepswe" cx={30} />
      </g>
      <Star className="pc-deepswe-fixed" x={14} y={11} />
    </g>
  ),
};

/* Coding agents: types on a laptop while code fills the screen. */
const AGENTS: Scene = {
  width: 33,
  css: [
    drop("pc-agents"),
    sitting("pc-agents"),
    ...[
      [3, 7, 6],
      [4, 8, 4],
      [3, 9, 5],
    ].map(([x, y], line) =>
      loop(`.pc-agents-l${line}`, `pc-agents-l${line}`, 3000, "transform", [
        [0, pivot(x, y, "scale(0,1)"), STEP],
        [300 + line * 600, pivot(x, y, "scale(0,1)"), EASE_OUT],
        [700 + line * 600, pivot(x, y, "scale(1,1)")],
        [2700, pivot(x, y, "scale(1,1)"), STEP],
        [3000, pivot(x, y, "scale(0,1)")],
      ], pivot(x, y, "scale(1,1)")),
    ),
    loop(".pc-agents-pa", "pc-agents-pa", 320, "transform", [[0, translate(0, 0), STEP], [160, translate(0, -1), STEP], [320, translate(0, 0)]]),
    loop(".pc-agents-pb", "pc-agents-pb", 320, "transform", [[0, translate(0, -1), STEP], [160, translate(0, 0), STEP], [320, translate(0, -1)]]),
    swish("pc-agents", 2600),
    blinkLoop("pc-agents", 4000),
  ].join(""),
  body: (
    <g className="pc-agents-in">
      <rect x="1" y="5" width="10" height="7" className="px-prop-dark" />
      <rect x="2" y="6" width="8" height="5" className="px-eye" />
      <rect x="3" y="7" width="6" height="1" className="px-led pc-agents-l0" />
      <rect x="4" y="8" width="4" height="1" className="px-yarn pc-agents-l1" />
      <rect x="3" y="9" width="5" height="1" className="px-led pc-agents-l2" />
      <rect x="0" y="12" width="12" height="2" className="px-prop" />
      <rect x="0" y="14" width="12" height="1" className="px-prop-dark" />
      <SittingCat id="pc-agents" cx={21} />
      <g className="pc-agents-pa">
        <Sprite rows={["oo"]} palette={PAW} x={8} y={11} />
      </g>
      <g className="pc-agents-pb">
        <Sprite rows={["oo"]} palette={PAW} x={10} y={11} />
      </g>
    </g>
  ),
};

/* About: says hello. */
const ABOUT: Scene = {
  width: 27,
  css: [
    drop("pc-about"),
    sitting("pc-about"),
    loop(".pc-about-arm", "pc-about-arm", 4400, "transform", [
      [0, pivot(3.5, 9, "rotate(0deg)"), EASE_IN_OUT],
      [700, pivot(3.5, 9, "rotate(-18deg)"), EASE_IN_OUT],
      [950, pivot(3.5, 9, "rotate(12deg)"), EASE_IN_OUT],
      [1200, pivot(3.5, 9, "rotate(-18deg)"), EASE_IN_OUT],
      [1450, pivot(3.5, 9, "rotate(12deg)"), EASE_IN_OUT],
      [1700, pivot(3.5, 9, "rotate(0deg)")],
    ]),
    swish("pc-about", 2400),
    blinkLoop("pc-about", 3600),
  ].join(""),
  body: (
    <g className="pc-about-in">
      <SittingCat id="pc-about" cx={14} />
      <g className="pc-about-arm">
        <Sprite rows={[".oo.", "oppo", "oooo", ".oo.", ".oo."]} palette={{ o: "px-cat", p: "px-pink" }} x={2} y={4} />
      </g>
    </g>
  ),
};

/* Legal, privacy and accessibility: reads, turning a page now and then. */
const READING: Scene = {
  width: 31,
  css: [
    drop("pc-reading"),
    sitting("pc-reading"),
    loop(".pc-reading-eyes-open", "pc-reading-eyes", 2100, "transform", [[0, translate(1, 0), STEP], [700, translate(0, 0), STEP], [1400, translate(-1, 0), STEP], [2100, translate(1, 0)]]),
    loop(".pc-reading-page", "pc-reading-page", 6300, "transform", [
      [0, pivot(5.5, 0, "scale(1,1)")],
      [4200, pivot(5.5, 0, "scale(1,1)"), EASE_IN_OUT],
      [4700, pivot(5.5, 0, "scale(-1,1)"), STEP],
      [4800, pivot(5.5, 0, "scale(1,1)")],
    ]),
    swish("pc-reading", 2800),
  ].join(""),
  body: (
    <g className="pc-reading-in">
      <SittingCat id="pc-reading" cx={19} />
      <Sprite
        rows={["dppppdppppd", "dpLLpdpLLpd", "dppppdppppd", "dpLLpdpLLpd", "dppppdppppd", "ddddddddddd"]}
        palette={{ d: "px-prop-dark", p: "px-paper", L: "px-prop" }}
        x={0}
        y={6}
      />
      <g className="pc-reading-page">
        <Sprite rows={["pppp", "pLLp", "pppp", "pLLp", "pppp"]} palette={{ p: "px-paper", L: "px-prop" }} x={6} y={6} />
      </g>
      <Sprite rows={["oo", "oo"]} palette={PAW} x={10} y={9} />
    </g>
  ),
};

const SCENES: Record<PageCatKind, Scene> = {
  home: HOME,
  catalog: CATALOG,
  detail: DETAIL,
  compare: COMPARE,
  deepswe: DEEPSWE,
  agents: AGENTS,
  about: ABOUT,
  reading: READING,
};

/**
 * Decorative; position it from the caller. Its bottom edge is the floor the cat
 * sits on, so `bottom-full` on a bordered box puts it on that box's top edge.
 */
export function PageCat({ kind, className }: { kind: PageCatKind; className?: string }) {
  const scene = SCENES[kind];
  return (
    <span aria-hidden="true" className={cn("page-cat pointer-events-none select-none", className)}>
      <PixelScene width={scene.width} height={H} css={scene.css} unit={UNIT}>
        {scene.body}
      </PixelScene>
    </span>
  );
}
