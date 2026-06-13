export type ModelAvailabilityStatus = "not_currently_available";

export const ANTHROPIC_FABLE_ACCESS_ARTICLE =
  "https://www.anthropic.com/news/fable-mythos-access";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Artificial Analysis marks unavailable chart entries with a checkered pattern.
 * Model pages embed the chart data in their RSC HTML, so this remains tied to
 * AA's live status and clears automatically when AA removes the marker.
 */
export function extractAAAvailabilityStatus(
  html: string,
  slug: string,
): ModelAvailabilityStatus | null {
  const escapedSlug = escapeRegExp(slug);
  const checkeredModelEntry = new RegExp(
    `\\\\?"url\\\\?":\\\\?"/models/${escapedSlug}\\\\?"[^{}]*\\\\?"pattern\\\\?":\\\\?"checkered\\\\?"`,
  );
  return checkeredModelEntry.test(html) ? "not_currently_available" : null;
}

export function isModelCurrentlyUnavailable(model: {
  availability_status?: ModelAvailabilityStatus | null;
}): boolean {
  return model.availability_status === "not_currently_available";
}

export function isClaudeFable5(slug: string): boolean {
  return slug === "claude-fable-5";
}
