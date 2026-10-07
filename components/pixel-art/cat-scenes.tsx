import { useRef, type RefObject } from "react";
import type { ErrorKind } from "@/lib/error-kind";
import { Cat, CatHead, CatPaw, CatTail, STEP, Star, Zzz, blinkLoop, gait, swish } from "./cat";
import { DIGIT_HEIGHT, Digit, EASE_IN, EASE_IN_OUT, EASE_OUT, PixelScene, Sprite, keyframes, pivot, track, translate } from "./pixel";
import { Spotlight } from "./spotlight";

/*
 * One pixel cat per error. Every scene shares the 128 × 80 stage and its floor
 * so the pages read as a set; the cat acts out what went wrong.
 */

const W = 128;
const H = 80;
const FLOOR = 72;
const TOP = FLOOR - DIGIT_HEIGHT;

type Key = readonly [number, string, string?];
const tx = (x: number) => translate(x, 0);
const ty = (y: number) => translate(0, y);
function Floor() {
  return <rect x="0" y={FLOOR} width={W} height="1" className="px-floor" />;
}

/* 500 — the cat walks over the code and knocks the last 0 off the table. */
const S500 = (() => {
  const T = 6400;
  const table = 52;
  const top = table - DIGIT_HEIGHT;
  const zero = (dx: number, dy: number, angle: number) => `${translate(dx, dy)} ${pivot(83, table, `rotate(${angle}deg)`)}`;
  const paw = (dx: number, dy: number) => translate(dx, dy);
  const css = [
    track(".s500-x", "s500-x", T, "transform", [[0, tx(-16)], [700, tx(4)], [850, tx(4)], [1250, tx(33)], [1350, tx(33)], [2200, tx(58)]]),
    track(".s500-y", "s500-y", T, "transform", [
      [0, ty(FLOOR)],
      [850, ty(FLOOR), EASE_OUT],
      [1050, ty(18), EASE_IN],
      [1250, ty(top)],
      [4500, ty(top), EASE_OUT],
      [4660, ty(top + 3)],
    ]),
    track(".s500-legs-a", "s500-legs-a", T, "transform", gait([[0, 700], [1350, 2200]], 0, { sitAt: 4500 })),
    track(".s500-legs-b", "s500-legs-b", T, "transform", gait([[0, 700], [1350, 2200]], 1, { sitAt: 4500 })),
    track(".s500-head", "s500-head", T, "transform", [
      [2200, translate(0, 0), EASE_OUT],
      [2350, translate(1, 1)],
      [3500, translate(1, 1), EASE_OUT],
      [3700, translate(2, 3)],
      [4300, translate(2, 3), EASE_OUT],
      [4450, translate(0, 0)],
    ]),
    track(".s500-paw", "s500-paw", T, "transform", [
      [2450, paw(0, 0), EASE_OUT],
      [2550, paw(6, 4), EASE_IN],
      [2650, paw(2, 2), EASE_OUT],
      [2750, paw(6, 4), EASE_IN],
      [2850, paw(2, 2), EASE_OUT],
      [2950, paw(6, 4)],
      [3300, paw(11, 4), EASE_OUT],
      [3450, paw(0, 0)],
    ]),
    track(".s500-zero", "s500-zero", T, "transform", [
      [2550, zero(0, 0, 0), EASE_OUT],
      [2600, zero(0, 0, 4), EASE_IN],
      [2700, zero(0, 0, 0)],
      [2750, zero(0, 0, 0), EASE_OUT],
      [2800, zero(0, 0, 5), EASE_IN],
      [2900, zero(0, 0, 0)],
      [2950, zero(0, 0, 0), EASE_IN_OUT],
      [3300, zero(6, 0, 0), EASE_IN],
      [3550, zero(6, 0, 28), EASE_IN],
      [3950, zero(10, 20, 90), EASE_OUT],
      [4080, zero(11, 16, 90), EASE_IN],
      [4200, zero(12, 20, 90)],
    ]),
    swish("s500", 1800),
    blinkLoop("s500", 3200, T),
  ].join("");

  return function Scene500() {
    return (
      <PixelScene width={W} height={H} css={css}>
        <Floor />
        <rect x="18" y={table} width="68" height="2" className="px-prop-dark" />
        <rect x="22" y={table + 2} width="2" height={FLOOR - table - 2} className="px-prop" />
        <rect x="80" y={table + 2} width="2" height={FLOOR - table - 2} className="px-prop" />
        <g className="px-ink">
          <Digit value="5" x={26} y={top} />
          <Digit value="0" x={47} y={top} />
          <g className="s500-zero">
            <Digit value="0" x={68} y={top} />
          </g>
        </g>
        <g className="s500-x">
          <g className="s500-y">
            <Cat id="s500" paw />
          </g>
        </g>
      </PixelScene>
    );
  };
})();

/* 503 — the cat sleeps on the code; one eye opens now and then. */
const S503 = (() => {
  const breath = 3000;
  const peek = 7000;
  const z = (delay: number) =>
    track(`.s503-z${delay}`, `s503-z${delay}`, 3000, "*", [
      [0, "transform:translate(0px,0px) scale(0.6);opacity:0"],
      [450, "transform:translate(2px,-4px) scale(0.75);opacity:1"],
      [2200, "transform:translate(8px,-14px) scale(1.05);opacity:1"],
      [3000, "transform:translate(11px,-19px) scale(1.2);opacity:0"],
    ], { repeat: true, delay: delay - 3000, rest: `transform:translate(${delay / 250}px,${-delay / 125}px) scale(0.9);opacity:1` });
  const css = [
    ".s503-legs-a,.s503-legs-b{transform:translate(0px,-3px)}",
    track(".s503-body", "s503-body", breath, "transform", [
      [0, pivot(0, -4, "scale(1,1)"), EASE_IN_OUT],
      [breath / 2, pivot(0, -4, "scale(1.03,1.12)"), EASE_IN_OUT],
      [breath, pivot(0, -4, "scale(1,1)")],
    ], { repeat: true }),
    track(".s503-head", "s503-head", breath, "transform", [
      [0, translate(0, 1), STEP],
      [breath * 0.3, translate(0, 0), STEP],
      [breath * 0.75, translate(0, 1)],
    ], { repeat: true }),
    track(".s503-eyes-rightOpen", "s503-peek", peek, "opacity", [[0, "0", STEP], [4800, "1", STEP], [5600, "0"]], { repeat: true }),
    track(".s503-eyes-rightClosed", "s503-peek-shut", peek, "opacity", [[0, "1", STEP], [4800, "0", STEP], [5600, "1"]], { repeat: true }),
    z(0),
    z(1000),
    z(2000),
  ].join("");

  return function Scene503() {
    return (
      <PixelScene width={W} height={H} css={css}>
        <Floor />
        <g className="px-ink">
          <Digit value="5" x={26} y={TOP} />
          <Digit value="0" x={47} y={TOP} />
          <Digit value="3" x={68} y={TOP} />
        </g>
        <g transform={`translate(54 ${TOP + 3})`}>
          <Cat id="s503" tail="curl" eyes={["leftClosed", "rightClosed", "rightOpen"]} />
        </g>
        <Zzz className="s503-z0" x={64} y={TOP - 16} />
        <Zzz className="s503-z1000" x={64} y={TOP - 16} />
        <Zzz className="s503-z2000" x={64} y={TOP - 16} />
      </PixelScene>
    );
  };
})();

/* 429 — a laser dot zips around faster and faster; the cat chases it, then sits down out of breath. */
const S429 = (() => {
  const T = 5200;
  // [ms, x, y]: the dot jitters in place, then jumps further and sooner each time.
  const dot: ReadonlyArray<readonly [number, number, number]> = [
    [300, 72, 70], [500, 74, 70], [700, 71, 69], [1000, 73, 70], [1080, 114, 70], [1300, 112, 69], [1600, 114, 70],
    [1660, 63, 58], [1850, 61, 59], [2100, 63, 58], [2150, 100, 70], [2300, 100, 70], [2350, 24, 60], [2480, 24, 60],
    [2520, 110, 70], [2640, 110, 70], [2680, 44, 56], [2780, 44, 56], [2810, 88, 70], [2900, 88, 70], [2930, 60, 64],
    [3000, 60, 64], [3030, 110, 70],
  ];
  const face = (right: boolean) => `scale(${right ? 1 : -1},1)`;
  const turns: ReadonlyArray<readonly [number, boolean]> = [
    [0, false], [1300, true], [1700, false], [2180, true], [2380, false], [2545, true], [2700, false], [2830, true], [2950, false], [3060, true],
  ];
  const runs: ReadonlyArray<readonly [number, number]> = [[1350, 1600], [2200, 2350], [2400, 2530], [2560, 2690], [2720, 2820], [2850, 2940], [2970, 3050], [3080, 3200]];
  const SIT = 3250;
  const css = [
    track(".r429-dot", "r429-dot", T, "*", [
      [0, `transform:${translate(72, 70)};opacity:0`, STEP],
      ...dot.map(([at, x, y]) => [at, `transform:${translate(x, y)};opacity:1`] as const),
    ]),
    track(".r429-dot-idle", "r429-dot-idle", 4200, "transform", [
      [0, translate(0, 0), EASE_IN_OUT],
      [1400, translate(-7, 0), EASE_IN_OUT],
      [2800, translate(5, -1), EASE_IN_OUT],
      [4200, translate(0, 0)],
    ], { repeat: true, delay: T }),
    track(".r429-face", "r429-face", T, "transform", turns.map(([at, right]) => [at, face(right), STEP] as const)),
    track(".r429-x", "r429-x", T, "transform", [
      [0, tx(100)], [950, tx(100)], [1250, tx(76)], [1350, tx(76)], [1600, tx(104)], [1720, tx(104)], [2080, tx(70)], [2200, tx(70)],
      [2350, tx(84)], [2400, tx(84)], [2530, tx(62)], [2560, tx(62)], [2690, tx(80)], [2720, tx(80)], [2820, tx(66)], [2850, tx(66)],
      [2940, tx(78)], [2970, tx(78)], [3050, tx(74)], [3080, tx(74)], [3200, tx(88)],
    ]),
    track(".r429-y", "r429-y", T, "transform", [
      [0, ty(FLOOR)],
      [950, ty(FLOOR), EASE_OUT],
      [1100, ty(FLOOR - 10), EASE_IN],
      [1250, ty(FLOOR)],
      [1720, ty(FLOOR), EASE_OUT],
      [1900, ty(FLOOR - 16), EASE_IN],
      [2080, ty(FLOOR)],
      [SIT, ty(FLOOR), EASE_OUT],
      [SIT + 150, ty(FLOOR + 3)],
    ]),
    // Rear wiggle before the first pounce.
    track(".r429-wiggle", "r429-wiggle", T, "transform", [
      [0, tx(0), STEP], [600, tx(-1), STEP], [680, tx(0), STEP], [760, tx(-1), STEP], [840, tx(0), STEP], [920, tx(-1), STEP], [950, tx(0)],
    ]),
    track(".r429-legs-a", "r429-legs-a", T, "transform", gait(runs, 0, { period: 140, sitAt: SIT })),
    track(".r429-legs-b", "r429-legs-b", T, "transform", gait(runs, 1, { period: 140, sitAt: SIT })),
    // Out of breath: quick breaths, tongue out, eyes half shut.
    track(".r429-body", "r429-body", 520, "transform", [
      [0, pivot(0, -4, "scale(1,1)"), EASE_IN_OUT],
      [260, pivot(0, -4, "scale(1.03,1.1)"), EASE_IN_OUT],
      [520, pivot(0, -4, "scale(1,1)")],
    ], { repeat: true, delay: SIT + 150 }),
    track(".r429-tongue", "r429-tongue", T, "opacity", [[0, "0", STEP], [SIT + 150, "1"]]),
    track(".r429-eyes-open", "r429-eyes", T, "transform", [[SIT + 150, pivot(0, -12, "scale(1,1)"), EASE_OUT], [SIT + 300, pivot(0, -12, "scale(1,0.5)")]]),
    swish("r429", 600, 16),
  ].join("");

  return function Scene429() {
    return (
      <PixelScene width={W} height={H} css={css}>
        <Floor />
        <g className="px-ink">
          <Digit value="4" x={14} y={TOP} />
          <Digit value="2" x={35} y={TOP} />
          <Digit value="9" x={56} y={TOP} />
        </g>
        <g className="r429-x">
          <g className="r429-y">
            <g className="r429-face">
              <g className="r429-wiggle">
                <Cat id="r429" />
                <rect x="6" y="-9" width="1" height="2" className="px-pink r429-tongue" />
              </g>
            </g>
          </g>
        </g>
        <g className="r429-dot">
          <g className="r429-dot-idle">
            <circle r="3.5" className="px-alert" opacity="0.3" shapeRendering="geometricPrecision" />
            <rect x="-1" y="-1" width="2" height="2" className="px-alert" />
          </g>
        </g>
      </PixelScene>
    );
  };
})();

/* 404 — in the dark, the cat searches with a flashlight until the beam finds the code. */
const FLASHLIGHT = ["dddl", "dddl"];
const ALERT = ["#", "#", "#", ".", "#"];
const BEAM_LENGTH = 80;

const S404 = (() => {
  const T = 5600;
  const FOUND = 2850;
  // The flashlight tip in the cat's own frame; the beam turns around it.
  const beam = (angle: number) => pivot(12, -9, `rotate(${angle}deg)`);
  const walkBob: Key[] = [];
  for (let at = 300; at < 1500; at += 300) walkBob.push([at, beam(at % 600 === 0 ? 12 : 16), EASE_IN_OUT]);
  const css = [
    track(".f404-x", "f404-x", T, "transform", [[0, tx(150)], [300, tx(150)], [1500, tx(106)]]),
    track(".f404-y", "f404-y", T, "transform", [
      [0, ty(FLOOR)],
      [FOUND + 100, ty(FLOOR), EASE_OUT],
      [FOUND + 230, ty(FLOOR - 3), EASE_IN],
      [FOUND + 370, ty(FLOOR)],
      [4000, ty(FLOOR), EASE_OUT],
      [4160, ty(FLOOR + 3)],
    ]),
    track(".f404-legs-a", "f404-legs-a", T, "transform", gait([[300, 1500]], 0, { sitAt: 4000 })),
    track(".f404-legs-b", "f404-legs-b", T, "transform", gait([[300, 1500]], 1, { sitAt: 4000 })),
    track(".f404-head", "f404-head", T, "transform", [
      [1500, translate(0, 0), EASE_OUT],
      [1800, translate(0, -1)],
      [2150, translate(0, -1), EASE_IN_OUT],
      [2400, translate(0, 1)],
      [2600, translate(0, 1), EASE_IN_OUT],
      [2800, translate(0, 0)],
    ]),
    // Searching: up into the dark, down at the floor, then onto the code.
    track(".f404-beam", "f404-beam", T, "transform", [
      [0, beam(14)],
      ...walkBob,
      [1500, beam(14), EASE_IN_OUT],
      [1900, beam(-22)],
      [2150, beam(-22), EASE_IN_OUT],
      [2450, beam(18)],
      [2550, beam(18), EASE_IN_OUT],
      [FOUND, beam(0)],
      [4000, beam(0), EASE_OUT],
      [4160, beam(-3)],
    ]),
    track(".f404-digits", "f404-digits", T, "fill", [[0, "var(--px-dim)"], [FOUND, "var(--px-dim)", EASE_OUT], [FOUND + 250, "var(--px-ink)"]]),
    track(".f404-pool", "f404-pool", T, "opacity", [[0, "0"], [FOUND, "0", EASE_OUT], [FOUND + 250, "0.35"]]),
    track(".f404-alert", "f404-alert", T, "*", [
      [0, `opacity:0;transform:${ty(2)}`, STEP],
      [FOUND + 100, `opacity:1;transform:${ty(2)}`, EASE_OUT],
      [FOUND + 250, `opacity:1;transform:${ty(0)}`],
      [3800, `opacity:1;transform:${ty(0)}`, EASE_IN],
      [4000, `opacity:0;transform:${ty(-2)}`],
    ]),
    // The rest of the page: the spot opens when the beam lands on the code.
    keyframes("f404-dim", T, "--spot", [[0, "0"], [FOUND, "0", EASE_OUT], [FOUND + 400, "1"]]),
    `.scene-dim{animation:f404-dim ${T}ms linear var(--scene-elapsed,0ms) 1 both,scene-dim-in 320ms ease-out}`,
    swish("f404", 1800),
    blinkLoop("f404", 3400, T),
  ].join("");

  // The cat faces left; one chain carries the cat, a copy carries the beam so
  // it can be clipped at the floor in scene coordinates.
  const Rig = ({ children }: { children: React.ReactNode }) => (
    <g className="f404-x">
      <g className="f404-y">
        <g transform="scale(-1 1)">{children}</g>
      </g>
    </g>
  );

  return function Scene404({ spotTarget }: { spotTarget?: RefObject<HTMLElement | null> }) {
    const scene = useRef<SVGSVGElement>(null);
    return (
      <>
        <PixelScene ref={scene} width={W} height={H} css={css}>
          <defs>
            <clipPath id="f404-floor">
              <rect x="0" y="0" width={W} height={FLOOR} />
            </clipPath>
            <linearGradient id="f404-beam-fill" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" className="px-beam-stop" stopOpacity="0.6" />
              <stop offset="1" className="px-beam-stop" stopOpacity="0" />
            </linearGradient>
          </defs>
          <g clipPath="url(#f404-floor)">
            <Rig>
              <g className="f404-head">
                <g className="f404-beam">
                  <polygon
                    points={`12,-10 12,-8 ${12 + BEAM_LENGTH},0 ${12 + BEAM_LENGTH},-21`}
                    fill="url(#f404-beam-fill)"
                    shapeRendering="geometricPrecision"
                  />
                </g>
              </g>
            </Rig>
          </g>
          <ellipse cx="50" cy={FLOOR} rx="40" ry="2.5" className="px-light f404-pool" shapeRendering="geometricPrecision" />
          <Floor />
          <g className="f404-digits">
            <Digit value="4" x={22} y={TOP} />
            <Digit value="0" x={43} y={TOP} />
            <Digit value="4" x={64} y={TOP} />
          </g>
          <Rig>
            <Cat id="f404" />
            <g className="f404-head">
              <Sprite rows={FLASHLIGHT} palette={{ d: "px-prop-dark", l: "px-light" }} x={8} y={-10} />
            </g>
            <g className="f404-alert">
              <Sprite rows={ALERT} palette={{ "#": "px-ink" }} x={5} y={-25} />
            </g>
          </Rig>
        </PixelScene>
        {spotTarget && <Spotlight target={spotTarget} scene={scene} timeline=".f404-x" />}
      </>
    );
  };
})();

/* 403 — the cat guards the 0: peeks through it, climbs up and raises a paw. */
const ARM = [".oo.", "oppo", "oooo", ".oo.", ".oo.", ".oo.", ".oo.", ".oo.", ".oo.", ".oo."];
const S403 = (() => {
  const T = 4400;
  const css = [
    track(".s403-rise", "s403-rise", T, "transform", [
      [0, ty(90)],
      [400, ty(90), EASE_OUT],
      [700, ty(71)],
      [1600, ty(71), EASE_IN_OUT],
      [1950, ty(61)],
    ]),
    track(".s403-eyes-open", "s403-look", T, "transform", [
      [0, translate(0, 0)],
      [850, translate(0, 0), STEP],
      [1000, translate(-1, 0), STEP],
      [1300, translate(1, 0), STEP],
      [1550, translate(0, 0)],
      [2700, pivot(0, -12, "scale(1,1)"), EASE_OUT],
      [2850, pivot(0, -12, "scale(1,0.5)")],
    ]),
    track(".s403-paws", "s403-paws", T, "*", [
      [0, "transform:translate(0px,3px);opacity:0", STEP],
      [1950, "transform:translate(0px,3px);opacity:1", EASE_OUT],
      [2100, "transform:translate(0px,0px);opacity:1"],
    ]),
    // The right paw leaves the edge and rises beside the head, pads out: no entry.
    track(".s403-grip", "s403-grip", T, "opacity", [[0, "1", STEP], [2500, "0", STEP], [4050, "1"]]),
    track(".s403-arm", "s403-arm", T, "*", [
      [0, `transform:${ty(3)};opacity:0`, STEP],
      [2500, `transform:${ty(3)};opacity:1`, EASE_OUT],
      [2720, `transform:${ty(-10)};opacity:1`],
      [3800, `transform:${ty(-10)};opacity:1`, EASE_IN_OUT],
      [4050, `transform:${ty(3)};opacity:1`, STEP],
      [4060, `transform:${ty(3)};opacity:0`],
    ]),
    // Hidden until it rises, since the 3 is open on its left.
    track(".s403-tail-rise", "s403-tail-rise", T, "*", [
      [0, `transform:${ty(9)};opacity:0`, STEP],
      [2100, `transform:${ty(9)};opacity:1`, EASE_OUT],
      [2400, `transform:${ty(0)};opacity:1`],
    ]),
    track(".s403-tail", "s403-tail", 2400, "transform", [
      [0, pivot(78, 52, "rotate(-8deg)"), EASE_IN_OUT],
      [1200, pivot(78, 52, "rotate(10deg)"), EASE_IN_OUT],
      [2400, pivot(78, 52, "rotate(-8deg)")],
    ], { repeat: true }),
    track(".s403-shake", "s403-shake", 5200, "transform", [
      [0, tx(0), STEP],
      [4400, tx(-1), STEP],
      [4520, tx(1), STEP],
      [4640, tx(-1), STEP],
      [4760, tx(0)],
    ], { repeat: true, delay: T }),
  ].join("");

  return function Scene403() {
    return (
      <PixelScene width={W} height={H} css={css}>
        <Floor />
        <g className="s403-tail-rise">
          <CatTail id="s403" x={74} y={46} />
        </g>
        <g transform="translate(49 0)">
          <g className="s403-rise">
            <g className="s403-shake">
              <CatHead id="s403" />
            </g>
          </g>
        </g>
        <g className="s403-arm">
          <Sprite rows={ARM} palette={{ o: "px-cat", p: "px-pink" }} x={59} y={TOP - 1} />
        </g>
        <g className="px-ink">
          <Digit value="4" x={26} y={TOP} />
          <Digit value="0" x={47} y={TOP} />
          <Digit value="3" x={68} y={TOP} />
        </g>
        <g className="s403-paws">
          <CatPaw x={48} y={TOP - 2} />
          <g className="s403-grip">
            <CatPaw x={57} y={TOP - 2} />
          </g>
        </g>
      </PixelScene>
    );
  };
})();

/* Network — the cat pounces on the cable and pulls the plug; the router goes red. */
const SNET = (() => {
  const T = 3400;
  const plug = (dx: number, dy: number, angle: number) => `${translate(dx, dy)} ${pivot(81, 69, `rotate(${angle}deg)`)}`;
  const spark = (dx: number, dy: number) =>
    track(`.net-spark-${dx}`, `net-spark-${dx}`, T, "*", [
      [0, "transform:translate(0px,0px) scale(0.4);opacity:0", STEP],
      [2350, "transform:translate(0px,0px) scale(0.4);opacity:1", EASE_OUT],
      [2650, `transform:translate(${dx}px,${dy}px) scale(1);opacity:0`],
    ]);
  const css = [
    track(".net-x", "net-x", T, "transform", [[0, tx(-16)], [1400, tx(52)], [2000, tx(52)], [2350, tx(72)], [2450, tx(72)], [2750, tx(56)]]),
    track(".net-y", "net-y", T, "transform", [
      [0, ty(FLOOR)],
      [2000, ty(FLOOR), EASE_OUT],
      [2175, ty(59), EASE_IN],
      [2350, ty(FLOOR)],
      [2450, ty(FLOOR), EASE_OUT],
      [2600, ty(FLOOR - 6), EASE_IN],
      [2750, ty(FLOOR)],
      [2950, ty(FLOOR), EASE_OUT],
      [3110, ty(FLOOR + 3)],
    ]),
    track(".net-wiggle", "net-wiggle", T, "transform", [
      [0, tx(0), STEP],
      [1650, tx(-1), STEP],
      [1730, tx(0), STEP],
      [1810, tx(-1), STEP],
      [1890, tx(0), STEP],
      [1950, tx(-1), STEP],
      [2000, tx(0)],
    ]),
    track(".net-legs-a", "net-legs-a", T, "transform", gait([[0, 1400]], 0, { sitAt: 2950 })),
    track(".net-legs-b", "net-legs-b", T, "transform", gait([[0, 1400]], 1, { sitAt: 2950 })),
    track(".net-head", "net-head", T, "transform", [
      [1400, translate(0, 0), EASE_OUT],
      [1550, translate(1, 1)],
      [2000, translate(1, 1), EASE_OUT],
      [2100, translate(0, 0)],
      [2950, translate(0, 0), EASE_OUT],
      [3100, translate(1, 2)],
    ]),
    track(".net-plug", "net-plug", T, "transform", [
      [2350, plug(0, 0, 0), EASE_OUT],
      [2550, plug(-3, -12, -50), EASE_IN],
      [2800, plug(-6, 0, -90), EASE_OUT],
      [2900, plug(-6, -2, -90), EASE_IN],
      [3000, plug(-6, 0, -90)],
    ]),
    track(".net-led-ok", "net-led-ok", T, "opacity", [[0, "1", STEP], [2450, "0"]]),
    track(".net-led-down", "net-led-down", T, "opacity", [[0, "0", STEP], [2450, "1"]]),
    track(".net-led-blink", "net-led-blink", 900, "opacity", [[0, "1", STEP], [450, "0", STEP], [900, "1"]], { repeat: true, delay: T }),
    spark(-5, -6),
    spark(2, -9),
    spark(6, -4),
    swish("net", 1600),
    blinkLoop("net", 3000, T),
  ].join("");

  return function SceneNetwork() {
    return (
      <PixelScene width={W} height={H} css={css}>
        <Floor />
        {/* Router with its status light. */}
        <rect x="24" y="55" width="2" height="9" className="px-prop" />
        <rect x="8" y="63" width="20" height="9" className="px-prop-dark" />
        <rect x="11" y="66" width="2" height="1" className="px-led net-led-ok" />
        <g className="net-led-down">
          <rect x="11" y="66" width="2" height="1" className="px-alert net-led-blink" />
        </g>
        <rect x="28" y="70" width="47" height="1" className="px-prop" />
        <g className="net-plug">
          <rect x="74" y="70" width="4" height="1" className="px-prop" />
          <rect x="84" y="68" width="3" height="1" className="px-prop" />
          <rect x="84" y="70" width="3" height="1" className="px-prop" />
          <rect x="78" y="67" width="6" height="5" className="px-prop-dark" />
        </g>
        {/* Power strip. */}
        <rect x="86" y="66" width="32" height="6" className="px-prop" />
        <Sprite rows={["e.e......e.e......e.e"]} palette={{ e: "px-eye" }} x={92} y={68} />
        <Star className="net-spark--5" x={87} y={67} />
        <Star className="net-spark-2" x={87} y={67} />
        <Star className="net-spark-6" x={87} y={67} />
        <g className="net-x">
          <g className="net-y">
            <g className="net-wiggle">
              <Cat id="net" />
            </g>
          </g>
        </g>
      </PixelScene>
    );
  };
})();

const SCENES = {
  server: S500,
  unavailable: S503,
  rateLimited: S429,
  forbidden: S403,
  network: SNET,
} satisfies Record<Exclude<ErrorKind, "notFound">, () => React.JSX.Element>;

/** The scene for an error; the 404 also dims the page around `spotTarget`. */
export function CatScene({ kind, spotTarget }: { kind: ErrorKind; spotTarget?: RefObject<HTMLElement | null> }) {
  if (kind === "notFound") return <S404 spotTarget={spotTarget} />;
  const Scene = SCENES[kind];
  return <Scene />;
}
