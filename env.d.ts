// Augments the Wrangler-generated `CloudflareEnv` (cloudflare-env.d.ts) with
// values that are set as Worker *secrets* (`wrangler secret put` / the
// Cloudflare dashboard) rather than declared in `wrangler.jsonc`.
//
// `wrangler types` only sees `wrangler.jsonc`, so it never emits these — they
// must be declared here so the code can read them without `as unknown` casts.

interface CloudflareEnv {
  /** 4th Artificial Analysis API fallback key (Worker secret). */
  ARTIFICIAL_ANALYSIS_FALLBACK_API_KEY_4?: string;
  /** Shared bearer secret guarding the manual /api/cron/refresh endpoint. */
  CRON_SECRET?: string;
}

declare namespace NodeJS {
  interface ProcessEnv {
    ARTIFICIAL_ANALYSIS_FALLBACK_API_KEY_4?: string;
  }
}
