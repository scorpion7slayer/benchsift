export type TransitionKind = "theme" | "language";

/**
 * Runs a DOM update inside a view transition marked on <html> with
 * `data-transition`, so each kind can style its own animation. Returns null
 * when the update ran directly: reduced motion, or no View Transitions API.
 * `origin` sets the point a circular reveal starts from.
 */
export function runViewTransition(
  kind: TransitionKind,
  update: () => void | Promise<void>,
  origin?: { x: number; y: number },
): ViewTransition | null {
  const html = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion || typeof document.startViewTransition !== "function") {
    void update();
    return null;
  }
  if (origin) {
    const radius = Math.hypot(
      Math.max(origin.x, window.innerWidth - origin.x),
      Math.max(origin.y, window.innerHeight - origin.y),
    );
    html.style.setProperty("--vt-x", `${origin.x}px`);
    html.style.setProperty("--vt-y", `${origin.y}px`);
    html.style.setProperty("--vt-r", `${Math.ceil(radius)}px`);
  }
  html.dataset.transition = kind;
  try {
    const transition = document.startViewTransition(update);
    void transition.finished
      .catch(() => undefined)
      .finally(() => {
        if (html.dataset.transition === kind) delete html.dataset.transition;
      });
    return transition;
  } catch {
    delete html.dataset.transition;
    void update();
    return null;
  }
}
