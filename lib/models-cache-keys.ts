// Single source of truth for the KV keys that store the pre-computed models
// list. Kept dependency-free so both `cron-cache.ts` (request path, imports
// the server-only `cf-env`) and `cron-refresh.ts` (scheduled handler, no
// framework deps) can use it.
//
// Migration protocol when bumping the schema:
//   1. Prepend a new key (e.g. `"nxtaicard:models:v14"`) at the top of
//      MODELS_KEYS — that's what writes target, and what reads try first.
//   2. Keep the previous key in the list so the site keeps serving its data
//      during the ~30 min gap between deploy and the next cron tick.
//   3. After a couple of cron runs, drop old keys from the list.
//
// Reads tolerate older entries because every field added to LLMModel is
// optional — missing fields just render as undefined.
export const MODELS_KEYS = [
  "nxtaicard:models:v13",
  "nxtaicard:models:v3",
] as const;

export const MODELS_WRITE_KEY = MODELS_KEYS[0];

// Stale-but-readable window for the KV entry. Long enough that a broken cron
// doesn't take the site down; short enough to eventually flush truly stale
// shapes.
export const MODELS_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days
