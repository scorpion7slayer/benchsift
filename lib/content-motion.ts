// Small, cancellable feedback on the content that changed, never a delay to navigation.
export function animateContent(
  element: HTMLElement | null,
  previous?: Animation | null,
): Animation | null {
  const opacity =
    previous && element ? getComputedStyle(element).opacity : "0.86";
  previous?.cancel();
  if (
    !element?.animate ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
    return null;
  return element.animate([{ opacity }, { opacity: 1 }], {
    duration: 150,
    easing: "ease-out",
  });
}
