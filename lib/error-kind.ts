/** The error pages BenchSift can show, each with its own scene and copy. */
export const ERROR_KINDS = ["notFound", "forbidden", "rateLimited", "server", "unavailable", "network"] as const;
export type ErrorKind = (typeof ERROR_KINDS)[number];

/** HTTP status shown on each page; a lost connection has none. */
export const ERROR_STATUS: Record<ErrorKind, number | null> = {
  notFound: 404,
  forbidden: 403,
  rateLimited: 429,
  server: 500,
  unavailable: 503,
  network: null,
};

// A failed fetch or a chunk that disappeared after a deployment; reloading fixes both.
const NETWORK_ERROR =
  /failed to fetch|networkerror|load failed|network error|dynamically imported module|importing a module script failed|chunkloaderror|loading chunk/i;
// Only explicit status wording, so an unrelated number in a message is ignored.
const STATUS_IN_MESSAGE = [
  /\b(?:status(?:\s+code)?|http)\s*:?\s*([45]\d\d)\b/i,
  /^([45]\d\d)\b/,
  /\b([45]\d\d)\s+(?:not found|forbidden|unauthorized|too many requests|bad gateway|service unavailable|gateway timeout)\b/i,
];

function statusOf(error: unknown): number | null {
  if (error && typeof error === "object") {
    const record = error as { status?: unknown; statusCode?: unknown; response?: { status?: unknown } };
    for (const value of [record.status, record.statusCode, record.response?.status]) {
      if (typeof value === "number" && value >= 400 && value < 600) return value;
    }
  }
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  for (const pattern of STATUS_IN_MESSAGE) {
    const match = message.match(pattern);
    if (match) return Number(match[1]);
  }
  return null;
}

/** Picks the page for an error caught by a route boundary. */
export function errorKind(error: unknown, { online = true }: { online?: boolean } = {}): ErrorKind {
  if (!online) return "network";
  const status = statusOf(error);
  if (status === 404 || status === 410) return "notFound";
  if (status === 401 || status === 403) return "forbidden";
  if (status === 429) return "rateLimited";
  if (status === 502 || status === 503 || status === 504) return "unavailable";
  if (status != null) return "server";
  const text = error instanceof Error ? `${error.name}: ${error.message}` : String(error ?? "");
  return NETWORK_ERROR.test(text) ? "network" : "server";
}

export function isErrorKind(value: unknown): value is ErrorKind {
  return typeof value === "string" && (ERROR_KINDS as readonly string[]).includes(value);
}
