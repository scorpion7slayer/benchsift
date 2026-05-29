# Dokploy Deployment Notes

This branch removes the Cloudflare Worker/Wrangler runtime and targets Dokploy
as a single-container Node application.

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
MODELS_CACHE_FILE=.data/models-cache.json
```

## Persistent Cache

The former Cloudflare KV cache is now a JSON file. Add a Dokploy volume mount:

- Mount Path: `/app/.data`
- Type: Docker named volume if you want Dokploy volume backups

Without this mount the app still works, but the cache is lost on redeploy and
the first requests after a cold start may do more upstream work.

## Schedule Job

Create a Dokploy **Application Schedule Job** for the running app container:

```bash
npm run refresh-cache
```

The command calls `POST /api/cron/refresh` locally with `CRON_SECRET`, so no
public scheduler URL is required. A 30-minute cadence matches the old Worker
cron behavior:

```cron
*/30 * * * *
```

Dokploy requires the target container to be running for Application Schedule
Jobs.

## Production Settings

For zero-downtime deploys and automatic rollback, configure Dokploy's Advanced
Swarm health check with:

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
