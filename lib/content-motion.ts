// Small, cancellable feedback on the content that changed, never a delay to navigation.
const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";

export function animateContent(
  element: HTMLElement | null,
  previous?: Animation | null,
  { rise = 0, duration = 150 }: { rise?: number; duration?: number } = {},
): Animation | null {
  // Continue from the current opacity when a new change interrupts the last one.
  const opacity = previous && element ? getComputedStyle(element).opacity : "0.86";
  previous?.cancel();
  if (!element?.animate || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return null;
  const from: Keyframe = rise ? { opacity, transform: `translateY(${rise}px)` } : { opacity };
  const to: Keyframe = rise ? { opacity: 1, transform: "none" } : { opacity: 1 };
  return element.animate([from, to], { duration, easing: rise ? EASE_OUT : "ease-out" });
}
