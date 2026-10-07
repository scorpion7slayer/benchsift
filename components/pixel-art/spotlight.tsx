import { useEffect, useRef, useSyncExternalStore, type RefObject } from "react";
import { createPortal } from "react-dom";

const subscribe = () => () => {};

/**
 * Dims the whole page except the area a scene lights. It is added after
 * hydration and joins the scene's timeline, which started at first paint; the
 * scene's CSS animates `--spot` on `.scene-dim`.
 */
export function Spotlight({
  target,
  scene,
  timeline,
}: {
  /** The lit area: the page content around the scene. */
  target: RefObject<HTMLElement | null>;
  scene: RefObject<SVGSVGElement | null>;
  /** Selector of an element in the scene whose animation sets the clock. */
  timeline: string;
}) {
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  const overlay = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = overlay.current;
    if (!hydrated || !node) return;
    const time = scene.current?.querySelector(timeline)?.getAnimations()[0]?.currentTime;
    node.style.setProperty("--scene-elapsed", `${-(typeof time === "number" ? time : 0)}ms`);

    let frame = 0;
    const place = () => {
      frame = 0;
      const rect = target.current?.getBoundingClientRect();
      if (!rect) return;
      // Wide enough to keep the message and its buttons in full light.
      node.style.setProperty("--spot-x", `${rect.left + rect.width / 2}px`);
      node.style.setProperty("--spot-y", `${rect.top + rect.height * 0.5}px`);
      node.style.setProperty("--spot-rx", `${Math.max(rect.width * 0.7, 260)}px`);
      node.style.setProperty("--spot-ry", `${Math.max(rect.height * 0.82, 280)}px`);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(place);
    };
    place();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [hydrated, scene, target, timeline]);

  return hydrated ? createPortal(<div ref={overlay} className="scene-dim" aria-hidden="true" />, document.body) : null;
}
