export type ModelAvailabilityStatus = "not_currently_available";

export const ANTHROPIC_FABLE_ACCESS_ARTICLE =
  "https://www.anthropic.com/news/fable-mythos-access";

const CHECKERED_PATTERN_MARKERS = [
  '"pattern":"checkered"',
  '\\"pattern\\":\\"checkered\\"',
] as const;

function hasCheckeredPatternAfterUrl(html: string, urlMarker: string): boolean {
  let searchFrom = 0;
  while (searchFrom < html.length) {
    const urlIndex = html.indexOf(urlMarker, searchFrom);
    if (urlIndex < 0) return false;

    const valueEnd = urlIndex + urlMarker.length;
    const nextObjectBoundary = html.slice(valueEnd).search(/[{}]/);
    const objectRemainder = html.slice(
      valueEnd,
      nextObjectBoundary < 0 ? html.length : valueEnd + nextObjectBoundary,
    );
    if (CHECKERED_PATTERN_MARKERS.some((marker) => objectRemainder.includes(marker))) {
      return true;
    }
    searchFrom = valueEnd;
  }
  return false;
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
  const modelPath = `/models/${slug}`;
  const urlMarkers = [
    `"url":"${modelPath}"`,
    `\\"url\\":\\"${modelPath}\\"`,
  ];
  return urlMarkers.some((marker) => hasCheckeredPatternAfterUrl(html, marker))
    ? "not_currently_available"
    : null;
}

export function isModelCurrentlyUnavailable(model: {
  availability_status?: ModelAvailabilityStatus | null;
}): boolean {
  return model.availability_status === "not_currently_available";
}

export function isClaudeFable5(slug: string): boolean {
  return slug === "claude-fable-5";
}

/** AA article introducing trusted-access models in its Cyber Index. */
export const AA_TRUSTED_ACCESS_ARTICLE =
  "https://artificialanalysis.ai/articles/trusted-access-models-cyber-index";

/**
 * Why Artificial Analysis lists a model the public cannot use: a Cyber Index
 * trusted-access configuration, or any model AA draws with its checkered
 * "Not publicly available" pattern.
 */
export type ModelAccessRestriction = "trusted_access" | "not_public";

export function modelAccessRestriction(model: {
  availability_status?: ModelAvailabilityStatus | null;
  cyber_index_result?: { access?: string | null } | null;
}): ModelAccessRestriction | null {
  if (model.cyber_index_result?.access === "trusted") return "trusted_access";
  return isModelCurrentlyUnavailable(model) ? "not_public" : null;
}

/** "public" hides restricted models; it does not assert that the rest are public. */
export type AvailabilityFilter = "all" | "public" | "restricted";

export function matchesAvailability(
  restriction: ModelAccessRestriction | null | undefined,
  filter: AvailabilityFilter,
): boolean {
  if (filter === "all") return true;
  return filter === "restricted" ? restriction != null : restriction == null;
}
