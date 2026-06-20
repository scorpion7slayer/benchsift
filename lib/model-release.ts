export function modelReleaseTime(model: {
  release_date?: string | null;
  release_timestamp?: string | null;
}): number {
  if (model.release_date) {
    const releaseDate = Date.parse(`${model.release_date}T00:00:00.000Z`);
    if (Number.isFinite(releaseDate)) return releaseDate;
  }

  if (model.release_timestamp) {
    const timestamp = Date.parse(model.release_timestamp);
    if (Number.isFinite(timestamp)) return timestamp;
  }

  return Number.NEGATIVE_INFINITY;
}
