// default open-next.config.ts file created by @opennextjs/cloudflare
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import kvIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache";
import { withRegionalCache } from "@opennextjs/cloudflare/overrides/incremental-cache/regional-cache";

export default defineCloudflareConfig({
	incrementalCache: withRegionalCache(kvIncrementalCache, {
		mode: "long-lived",
		shouldLazilyUpdateOnCacheHit: false,
	}),
});
