import { EASE_IN_OUT, Sprite, pivot, track, translate } from "./pixel";

/*
 * A pixel tabby in the spirit of Clawd: one chunky block, vertical eyes, column
 * legs. Its origin is the floor under its body; it faces right.
 */

const CAT = { o: "px-cat", s: "px-cat-dark", p: "px-pink", e: "px-eye" };

const BODY = [".osooosooosoo.", "oosooosooosooo", "oooooooooooooo", "oooooooooooooo", "oooooooooooooo", ".oooooooooooo."];
const HEAD = ["o.......o", "oo.....oo", "opo...opo", "oooosoooo", "ooooooooo", "ooooooooo", "ooooooooo", "ooooPoooo", ".ooooooo."];
const TAIL = [".ss...", "oo....", "oo....", "oo....", "ooo...", ".ooo..", "..oooo"];
const TAIL_CURL = ["oo...........", ".ooooooooosss"];
const LEG = ["oo", "oo", "oo"];
export const PAW = [".oo.", "oppo", "oooo"];
const Z = ["####", "..#.", ".#..", "####"];
const STAR = [".#.", "###", ".#."];

const LEFT_OPEN = { x: 3, y: -13, w: 1, h: 2 };
const RIGHT_OPEN = { x: 7, y: -13, w: 1, h: 2 };
const LEFT_CLOSED = { x: 2, y: -12, w: 2, h: 1 };
const RIGHT_CLOSED = { x: 6, y: -12, w: 2, h: 1 };
const EYES = {
  open: [LEFT_OPEN, RIGHT_OPEN],
  closed: [LEFT_CLOSED, RIGHT_CLOSED],
  leftClosed: [LEFT_CLOSED],
  rightClosed: [RIGHT_CLOSED],
  rightOpen: [RIGHT_OPEN],
} as const;
const DIZZY = ["e.e", ".e.", "e.e"];

export type EyeKind = keyof typeof EYES | "dizzy";

/** Head with its eyes; each eye set sits in `${id}-eyes-${kind}` so a scene can swap or blink it. */
export function CatHead({ id, eyes = ["open"] }: { id: string; eyes?: readonly EyeKind[] }) {
  return (
    <g className={`${id}-head`}>
      <Sprite rows={HEAD} palette={{ ...CAT, P: "px-pink" }} x={1} y={-18} />
      {eyes.map((kind) => (
        <g key={kind} className={`${id}-eyes-${kind}`}>
          {kind === "dizzy" ? (
            <>
              <Sprite rows={DIZZY} palette={CAT} x={2} y={-14} />
              <Sprite rows={DIZZY} palette={CAT} x={6} y={-14} />
            </>
          ) : (
            EYES[kind].map((eye) => <rect key={eye.x} x={eye.x} y={eye.y} width={eye.w} height={eye.h} className="px-eye" />)
          )}
        </g>
      ))}
    </g>
  );
}

export function CatTail({ id, x = -12, y = -16 }: { id: string; x?: number; y?: number }) {
  return (
    <g className={`${id}-tail`}>
      <Sprite rows={TAIL} palette={CAT} x={x} y={y} />
    </g>
  );
}

export function CatPaw({ x, y }: { x: number; y: number }) {
  return <Sprite rows={PAW} palette={CAT} x={x} y={y} />;
}

/**
 * The whole cat. Legs sit in two groups that alternate while walking and slide
 * up behind the body when it sits; `paw` adds a front paw that can reach forward.
 */
export function Cat({
  id,
  eyes,
  tail = "up",
  paw = false,
}: {
  id: string;
  eyes?: readonly EyeKind[];
  tail?: "up" | "curl" | "none";
  paw?: boolean;
}) {
  return (
    <>
      {tail === "up" && <CatTail id={id} />}
      <g className={`${id}-legs-a`}>
        <Sprite rows={LEG} palette={CAT} x={-7} y={-3} />
        <Sprite rows={LEG} palette={CAT} x={1} y={-3} />
      </g>
      <g className={`${id}-legs-b`}>
        <Sprite rows={LEG} palette={CAT} x={-4} y={-3} />
        <Sprite rows={LEG} palette={CAT} x={4} y={-3} />
      </g>
      {paw && (
        <g className={`${id}-paw`}>
          <Sprite rows={["ooo", "ooo"]} palette={CAT} x={3} y={-6} />
        </g>
      )}
      <g className={`${id}-body`}>
        <Sprite rows={BODY} palette={CAT} x={-8} y={-9} />
        {tail === "curl" && <Sprite rows={TAIL_CURL} palette={CAT} x={-9} y={-5} />}
      </g>
      <CatHead id={id} eyes={eyes} />
    </>
  );
}

export function Zzz({ className, x, y }: { className: string; x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className={className}>
        <Sprite rows={Z} palette={{ "#": "px-ink" }} />
      </g>
    </g>
  );
}

export function Star({ className, x, y, fill = "px-star" }: { className: string; x: number; y: number; fill?: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className={className}>
        <Sprite rows={STAR} palette={{ "#": fill }} x={-1} y={-1} />
      </g>
    </g>
  );
}

type Key = readonly [number, string, string?];
export const STEP = "steps(1,end)";

/**
 * Alternating leg keys over walking intervals; `sitAt` then tucks the legs
 * behind the body.
 */
export function gait(intervals: ReadonlyArray<readonly [number, number]>, phase: 0 | 1, { period = 240, sitAt }: { period?: number; sitAt?: number } = {}): Key[] {
  const keys: Key[] = [[0, translate(0, 0), STEP]];
  for (const [start, end] of intervals) {
    let up = phase === 0;
    for (let at = start; at < end; at += period / 2) {
      keys.push([at, translate(0, up ? -1 : 0), STEP]);
      up = !up;
    }
    keys.push([end, translate(0, 0), STEP]);
  }
  if (sitAt !== undefined) keys.push([sitAt, translate(0, 0)], [sitAt + 160, translate(0, -3)]);
  return keys;
}

/** Eyes shut briefly: for a blink loop on `${id}-eyes-open`. */
export const blink = (cx: number, period: number): Key[] => {
  const shut = `translate(${cx}px,-12px) scale(1,0.15) translate(${-cx}px,12px)`;
  const open = `translate(${cx}px,-12px) scale(1,1) translate(${-cx}px,12px)`;
  return [
    [0, open],
    [period - 220, open],
    [period - 150, shut],
    [period - 80, open],
  ];
};

/** Tail sway around its base, looping. */
export const swish = (id: string, period: number, angle = 10) =>
  track(`.${id}-tail`, `${id}-tail`, period, "transform", [
    [0, pivot(-8, -9, "rotate(0deg)"), EASE_IN_OUT],
    [period / 2, pivot(-8, -9, `rotate(${angle}deg)`), EASE_IN_OUT],
    [period, pivot(-8, -9, "rotate(0deg)")],
  ], { repeat: true });

export const blinkLoop = (id: string, period: number, delay = 0) =>
  track(`.${id}-eyes-open`, `${id}-blink`, period, "transform", blink(5, period), { repeat: true, delay });
