# Dokploy Deployment Notes

BenchSift runs as a single-container Bun application. The included `Dockerfile`
builds Nitro output and starts `.output/server/index.mjs`.

## Recommended Service Type

Use a Dokploy **Application** with the **Dockerfile** build type:

- Dockerfile Path: `Dockerfile`
- Docker Context Path: `.`
- Container Port / Domain Target Port: `3000`
- Health check route: `/health`

Dokploy Applications are a good fit here because BenchSift is one web service.
Use Docker Compose only if you later add sidecar services.

## Runtime Variables

Set these in the Dokploy service Environment tab:

```env
ARTIFICIAL_ANALYSIS_API_KEY=
ARTIFICIAL_ANALYSIS_FALLBACK_API_KEY=
ARTIFICIAL_ANALYSIS_FALLBACK_API_KEY_2=
ARTIFICIAL_ANALYSIS_FALLBACK_API_KEY_3=
ARTIFICIAL_ANALYSIS_FALLBACK_API_KEY_4=
OPENROUTER_API_KEY=
HUGGINGFACE_API_KEY=
CRON_SECRET=
MODELS_CACHE_FILE=/app/.data/models-cache.json
# Optional: default is 1800000 (30 minutes)
REFRESH_CACHE_TIMEOUT_MS=1800000
```

## Persistent Cache

The catalogue persists in a JSON file. To retain it across redeploys, add a
Dokploy volume mount:

- Mount Path: `/app/.data`
- Type: Docker named volume if you want Dokploy volume backups

Without this mount the app still works, but the cache is lost on redeploy and
the first requests after a cold start may do more upstream work.

Use one stable named volume attached to the Application across releases. Do not
replace it with an anonymous or release-specific volume: that makes the visible
model count fall back to the cold-start catalogue until the next full refresh.
Cache replacement is atomic, so stopping a container during a refresh keeps the
last complete JSON file instead of exposing a partially written catalogue to
the next version.

After a deployment, check `/health`: `catalog.models` should remain populated
immediately and `catalog.refreshedAt` should predate the new container when no
scheduled refresh has run yet. An unexpected timestamp reset or smaller count
warrants checking the volume attachment and refresh logs; it does not alone
prove a volume failure.

## Schedule Job

Create a Dokploy **Application Schedule Job** for the running app container:

```bash
bun run refresh-cache
```

The command calls `POST /api/cron/refresh` locally with `CRON_SECRET`, so no
public scheduler URL is required. Configure the cadence explicitly; for example,
to refresh every 30 minutes:

```cron
*/30 * * * *
```

Dokploy requires the target container to be running for Application Schedule
Jobs. The Docker image installs `bash` because Dokploy executes the command in
the running container through `bash -c`. The `refresh-cache` script uses the
Node-compatible HTTP client provided by Bun with a configurable timeout because
the full upstream refresh can take longer than the default request timeout.

The command prints the refresh response (`ok`, `count`, and `stats`), then the
result of `GET /api/cron/status`. Both endpoints require the bearer secret.
Compare counters and `refreshedAt` with the previous cache; counts depend on
upstream coverage and are not fixed deployment targets.

If the Artificial Analysis sitemap cannot be fetched, the job fails instead
of writing the smaller cold-start cache. The sitemap is used only to add missing
models; API models that are not present in the sitemap are still kept.

## Production Settings

For a Swarm liveness check, configure Dokploy's Advanced health check with:

```json
{
  "Test": ["CMD", "curl", "-f", "http://localhost:3000/health"],
  "Interval": 30000000000,
  "Timeout": 10000000000,
  "StartPeriod": 30000000000,
  "Retries": 3
}
```

If builds are too heavy for the Dokploy server, build and push the Docker image
from CI, then configure the Dokploy Application source as Docker image.

A successful `/health` HTTP response proves liveness, not catalogue freshness or
zero-downtime rollout. Inspect `status`, `catalog.status`, `catalog.models`, and
`catalog.refreshedAt` as well. Stale or unavailable data returns a degraded state
with HTTP 200. Deployment update and rollback policies must be configured
separately from this check.
