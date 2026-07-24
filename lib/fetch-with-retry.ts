const RETRYABLE_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);
const RETRYABLE_METHODS = new Set(["GET", "HEAD"]);

const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_BASE_DELAY_MS = 250;
const DEFAULT_MAX_DELAY_MS = 2_000;

type FetchLike = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

export interface FetchRetryOptions {
  timeoutMs?: number;
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  fetchImpl?: FetchLike;
  sleep?: (delayMs: number) => Promise<void>;
  random?: () => number;
  now?: () => number;
}

let totalRetryCount = 0;

export function getFetchRetryCount(): number {
  return totalRetryCount;
}

function requestMethod(input: string | URL | Request, init: RequestInit): string {
  return (
    init.method ??
    (input instanceof Request ? input.method : "GET")
  ).toUpperCase();
}

function parseRetryAfterMs(
  value: string | null,
  now: () => number,
): number | null {
  if (!value) return null;

  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.round(seconds * 1_000);
  }

  const date = Date.parse(value);
  if (Number.isNaN(date)) return null;
  return Math.max(0, date - now());
}

function retryDelayMs(
  retryNumber: number,
  response: Response | null,
  options: Required<
    Pick<FetchRetryOptions, "baseDelayMs" | "maxDelayMs" | "random" | "now">
  >,
): number {
  const retryAfter = parseRetryAfterMs(
    response?.headers.get("retry-after") ?? null,
    options.now,
  );
  if (retryAfter !== null) {
    return Math.min(options.maxDelayMs, retryAfter);
  }

  const exponential = Math.min(
    options.maxDelayMs,
    options.baseDelayMs * 2 ** Math.max(0, retryNumber - 1),
  );
  const jitter = 0.75 + options.random() * 0.5;
  return Math.min(options.maxDelayMs, Math.round(exponential * jitter));
}

function attemptSignal(
  externalSignal: AbortSignal | null | undefined,
  timeoutMs: number | undefined,
): AbortSignal | undefined {
  if (timeoutMs === undefined) return externalSignal ?? undefined;
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  return externalSignal
    ? AbortSignal.any([externalSignal, timeoutSignal])
    : timeoutSignal;
}

async function defaultSleep(delayMs: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, delayMs));
}

/**
 * Retries only idempotent GET/HEAD requests on transient network failures or
 * retryable HTTP statuses. Every attempt receives a fresh timeout signal.
 */
export async function fetchWithRetry(
  input: string | URL | Request,
  init: RequestInit = {},
  options: FetchRetryOptions = {},
): Promise<Response> {
  const requestedAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const maxAttempts = Number.isFinite(requestedAttempts)
    ? Math.max(
        1,
        Math.min(DEFAULT_MAX_ATTEMPTS, Math.floor(requestedAttempts)),
      )
    : DEFAULT_MAX_ATTEMPTS;
  const requestedBaseDelay = options.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
  const requestedMaxDelay = options.maxDelayMs ?? DEFAULT_MAX_DELAY_MS;
  const delayOptions = {
    baseDelayMs: Number.isFinite(requestedBaseDelay)
      ? Math.max(0, requestedBaseDelay)
      : DEFAULT_BASE_DELAY_MS,
    maxDelayMs: Number.isFinite(requestedMaxDelay)
      ? Math.max(0, requestedMaxDelay)
      : DEFAULT_MAX_DELAY_MS,
    random: options.random ?? Math.random,
    now: options.now ?? Date.now,
  };
  const fetchImpl = options.fetchImpl ?? fetch;
  const sleep = options.sleep ?? defaultSleep;
  const canRetry = RETRYABLE_METHODS.has(requestMethod(input, init));

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let response: Response | null = null;
    try {
      response = await fetchImpl(input, {
        ...init,
        signal: attemptSignal(init.signal, options.timeoutMs),
      });

      const shouldRetry =
        canRetry &&
        RETRYABLE_STATUSES.has(response.status) &&
        attempt < maxAttempts;
      if (!shouldRetry) return response;
    } catch (error) {
      const externalAbort = init.signal?.aborted === true;
      if (!canRetry || externalAbort || attempt >= maxAttempts) throw error;
    }

    const delayMs = retryDelayMs(attempt, response, delayOptions);
    totalRetryCount += 1;
    await response?.body?.cancel().catch(() => undefined);
    await sleep(delayMs);
  }

  throw new Error("Retry loop completed without a response");
}
