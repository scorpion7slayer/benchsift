# Deployment and verification

The runtime stays Bun 1.3.14, TanStack Start, Vite and Nitro (`node-server`). React
and Radix provide the interface; Tailwind and its small utility packages provide
styling. LobeHub, Lucide, router devtools and the shadcn CLI dependency were removed.
The checked-in shadcn components remain usable without its CLI in production.
Rune normal SVGs are local React components; Artificial Analysis, Models.dev and
selected Lobe brand SVGs and Geist fonts are
local static files. See `public/licenses/` for licences and provenance. To add a
Rune icon, copy the normal SVG, preserve its geometry and adapt colour to
`currentColor` in `components/icons.tsx`. Do not install an unofficial package.

## Runtime image

The runtime image contains Nitro’s standalone `.output`, the package manifest
and the refresh script. Nitro includes its traced runtime dependencies inside
`.output/server`; a second production `node_modules` tree is unnecessary. The
health check uses Bun fetch, so Bash and curl are no longer installed.

Keep the normal Bun runtime mode. `--smol` was evaluated locally but did not give
a consistent memory benefit under the tested SSR load. Apply actual memory
limits and verify peak usage in Dokploy before choosing a smaller container.

## URL rules

No Apache sits in front of the container, so an `.htaccess` file would have no
effect. The rewrite rules live in `lib/canonical-url.ts` and run as request
middleware in `src/start.ts`, after the legacy-host redirect. A GET or HEAD
request for a variant of a path receives one `308` to its canonical form, with
the query string kept. The rules:

- remove duplicate slashes and the trailing slash;
- lowercase fixed segments;
- drop `.html` and `index.html`;
- send `/models/page/1` to `/models` and strip leading zeros from page numbers;
- send `/agents` and `/docs` to their only page.

Model slugs keep their case, because AA publishes some with capitals
(`QwQ-32B-Preview`). The model page redirects any other spelling of a slug to
the real one with a `301`. Hashed assets, `/_serverFn/`, `/logos/` and
`/fonts/` are never rewritten.

## Cache on Dokploy

Keep a persistent volume mounted at `/app/.data` and set
`MODELS_CACHE_FILE=/app/.data/models-cache.json`. The file remains the durable copy.
A file stat detects atomic replacements, parsed snapshots are reused, and catalogue
normalisation and homepage projections run once per snapshot. Concurrent cold
requests and refresh calls in one process share their in-flight work. The generic
upstream cache keeps at most 128 entries, promotes cache hits, and releases expired
values using one unreferenced timer. Rejected fetches are not cached. Identical
Redis and file snapshots share the same parsed object; a SHA-256 digest replaces
the retained serialized Redis copy. A local write reuses the published catalogue
without parsing a duplicate.

Optionally create Redis 7.2+ in Dokploy, enable authentication and persistent Redis
storage, and set `REDIS_URL` to its **private network** connection URL in the app.
Do not publish Redis's port. Redis does not need a JavaScript package: the client
is provided by Bun. Node can still run the app using the file fallback, but Redis
requires Bun. The shared key is `benchsift:catalogue:shared:v1` with a 30-day TTL;
use a dedicated Redis database for each environment.

Workers check Redis at most once every five seconds, compare timestamps with the
file snapshot, and choose the newer valid catalogue. Commands have an 800 ms
deadline and failures open a 30-second circuit breaker. Writes persist atomically
to disk before attempting Redis. Stale catalogues stay readable; `/health` reports
staleness without exposing credentials, paths or internal errors. A failed Redis
write leaves the file healthy; the next successful refresh republishes it.

Keep **one scheduled refresh job** across replicas. Refresh coalescing is local
to each process, not a distributed lock. Configure Dokploy to execute
`bun run refresh-cache` in the app container; the existing bearer-protected
endpoint and source completeness safeguards remain in effect. Never expose an
unauthenticated refresh route. No production refresh or infrastructure change is
performed by this implementation.

## Sources

`https://models.dev/models.json` provides canonical, provider-independent models.
The source is fetched server-side during a cold catalogue build or scheduled
refresh and is optional on failures. Concurrent fetches share their work. Once
merged into the persisted catalogue, its temporary source snapshot is released.
Only exact source IDs or unambiguous creator-scoped names match existing records.
It fills missing specifications and can add models; it supplies no AA benchmark,
speed or pricing fields. Every enriched record retains its Models.dev ID and link.
Ambiguous matches are skipped. Historical Models.dev rows are merged when a
first-party record arrives, rather than being retained as duplicate models.
Models without benchmark values remain visible through Advanced/catalogue flows.

xAI, x-ai, SpaceXAI and SpaceXSI share one creator identity displayed as SpaceXSI. Duplicate
Models.dev rows merge into the measured model on both refresh and cache reads;
their old detail URLs redirect to the canonical model.

Stealth previews stay searchable without requiring a benchmark score. Advanced
mode has a Stealth filter, including former previews. Scheduled refreshes read
OpenRouter's official stealth listings and each preview's structured model/FAQ
data, including older "cloaked model" descriptions. A small source-linked list
of OpenRouter announcements covers previews whose descriptions omit anonymity.
The exact model's reveal notice is also checked because JSON-LD can lag behind
the visible page. Only an explicit reveal with a unique target ID establishes an alias.
Related model cards and guesses never establish identity. A revealed preview's
name, URL and history move to the published model, without carrying over preview
prices or scores. Unrevealed previews and reveals whose target is absent stay
in the catalogue. Dates distinguish the source's listing date from BenchSift's
first observation; historical observations that were never recorded stay absent.
The existing persistent cache retains this history through later refreshes and
source outages. Existing caches acquire the new history on their next refresh.

The other benchmark pages use separate upstream snapshots, not the persisted
model catalogue. Artificial Analysis's `/agents/coding-agents` RSC response
contains a highlights array and a full `benchmarkRows` array. The JSON-only
parser resolves Flight property references to retain the full list; unresolved
references reject the snapshot. Component IDs and labels come from the source,
so Terminal-Bench v4 and DeepSWE v1.1 never overwrite historical v2/v1 fields.

DeepSWE reads its versioned public leaderboard artifacts. The default view keeps
the best measured effort per provider/model/harness; all efforts and historical
v1 results remain selectable. Published cost assumptions are preserved. Neither
missing harness names nor missing run counts are inferred.

FrontierCode reads the `initialModels` array of Artificial Analysis's
`/evaluations/frontiercode` RSC response, keeping only models with a published
score in `[0, 1]`; a measured zero stays a score. AA's page computes cost, time
and tokens per task in the browser from published fields; BenchSift applies the
same formulas over the 100-task Main set: cache hits at the cache-hit price,
other input at the cache-write price (else the input price), output at the
output price, and time as output tokens over output speed. Tests pin these to
the values AA displays. A model without a cache hit rate or with zero prices has
no cost, as on AA; a missing input leaves the figure null. Rows join the catalogue by AA slug (or alias); an
unlisted slug keeps the source name and has no link.

AA-3D reads the same `initialModels` array from Artificial Analysis's
`/evaluations/aa-3d` RSC response, keeping models with a positive `aa3dElo`, and
joins the 95% interval from the leaderboard element's `models` prop by AA id;
an interval published for a different Elo is dropped. The reference model AA
fixes at 1,000 has a zero-width interval and is shown as the reference. Cost
and output tokens per scene reuse the FrontierCode formulas
(`lib/aa-eval-cost.ts`) over the 55 tasks, which reproduces the live AA page;
the launch article's figures for "Default Fallback" Claude configurations also
price fallback-served turns and are not reproduced. The median turn count comes
from `aa3dBreakdown.turns.p50`. Rows join the catalogue as FrontierCode's do.

The Decision Index reads the `contestants` array of Artificial Analysis's
`/evaluations/artificial-analysis-decision-index` RSC response: the published
index, its five component scores (0–100), cost and time per task, and whether
the contestant is a decision model or a language model. Ids are
`<host>_<model>`; the model part joins the catalogue by slug or alias, then by
the same slug with dots read as dashes (AA writes `jev-1.13` as `jev-1-13`)
against catalogue slugs and OpenRouter model ids, and an ambiguous loose match
stays unlinked. Model pages stream the matched result after the first render,
keeping a model's best host when AA measured several.

AA-Robotics has no RSC or API data: the `/articles/aa-robotics` charts import
it from module literals in the article's hashed page chunk. BenchSift reads the
chunk path and version from the article's RSC response, fetches that chunk from
the AA origin, and parses the models, tasks, per-attempt records, per-task
scores, run timelines and human baseline. Score is the mean per-task score (an
unpublished task counts as zero, as on AA); cost and time per task are the
means over attempts, and the time to first action averages the timelines that
publish it. Tests pin the parser to the minifier's syntax (`!0`, hex integers,
`1/60`). If AA restructures the bundle the page shows its empty state rather
than partial data. Rows join the catalogue like FrontierCode.

The page also embeds the article's videos, streamed from AA's CDN: the task
loops and the run explorer's `videoBaseUrl` and `available` list come from the
RSC payload, and the captioned mistake clips from the chunk under
`clipBaseUrl`. Only `.mp4` files under `https://artificialanalysiscdn.com/` for
a known task and model are kept. Run videos tile the left, right and overhead
cameras in a 2×2 grid at 8× real time; the player draws each camera on its own
canvas, and the selection is kept in the URL (`task`, `model`, `camera`,
`issue`, `clips`). Its timeline uses each run's arm-activity histogram,
`activitySegments` (stretches where the arm moves, which also drive "movement
only") and its first-action, passing-state and end markers, all from the chunk.
AA publishes task texts, clip captions and end reasons in English only;
`lib/aa-robotics-fr.ts` translates them, keyed by task id or clip path, and
anything new keeps its English text until it is added there.

All six benchmark sources have a six-hour process cache, shared in-flight
requests, and a 30-second retry cooldown after failures. An unavailable source
is not cached as a successful empty response for six hours. These caches are not stored in Redis.

Comparison renders cached measurements immediately and loads supplementary
capabilities independently in the browser. A failed supplement preserves the
cached measurements. Only the current selection and up to 20 recent supplement
requests are retained by the comparison component. Catalogue directory pages
receive only their 48 displayed records. Unused route data becomes eligible for
collection after two minutes, or 30 seconds for unused preloads.

The comparison uses one responsive table with grouped views and URL-backed
selection. Only distinct numeric values with a known better direction receive
an advantage marker. Missing values remain missing; prices with different units
have separate rows. Unknown benchmark units remain raw values. Selection motion
uses the browser animation API, with cancellation and reduced-motion support;
navigation does not wait for a decorative exit animation.

Provider and agent logos use locally hosted Artificial Analysis assets first,
with Models.dev and bundled Lobe SVG fallbacks. Compound Devin Fusion configurations use the creator
mapping published by Artificial Analysis; unknown component creators stay
unassigned. Original logo artwork is preserved, including monochrome brands.
Source colours tint the surrounding tiles, with semantic accents on controls.
The latest three catalogue models appear together without a rotating carousel.

## Before publication

- Configure HTTPS at the proxy; verify the response headers on the public domain.
- Run `bun test`, `bun run typecheck`, `bun run build`, and
  `bun install --frozen-lockfile` with Bun 1.3.14.
- Verify `/health`, `/privacy`, `/legal`, `/accessibility`, model details and
  comparisons from the production build, using real data.
- Check both languages and themes, mobile/tablet/desktop, keyboard and reduced
  motion. Verify no Rybbit request occurs before acceptance or after refusal;
  acceptance loads one script and withdrawal unloads it. Google Fonts, the old
  duplicate analytics endpoint and external logo requests should remain absent.
- Verify Redis with a private test instance, then the actual deployment: refresh,
  restart workers, stop Redis temporarily, and check file fallback and health.

Cookie-personalised SSR is private (`Cache-Control: private, no-cache`). Static
fonts and logos have a one-day public cache; they are not marked immutable because
their URLs are stable. Adding HTTP caching for JSON later must distinguish server
function responses from personalised SSR documents.

## Rybbit consent

The sole analytics endpoint is `https://rybbit.nxtaigen.com/api/script.js`, site
ID `4e72af66bb61`. It is injected client-side only after a valid explicit consent
and only on `https://benchsift.nxtaigen.com`. Preview builds deliberately never
send analytics. There is no unconditional script, preconnect or SSR injection.
Refusal and acceptance have equal prominence and a 180-day lifetime. The footer
opens preferences; withdrawal reloads the page to unload active trackers.

Session replay and autocapture are controlled in the Rybbit dashboard, not by an
invented `data-disable-replay` attribute. The currently enabled capabilities are
disclosed in both languages. `data-replay-mask-all-inputs=true` explicitly masks
input values in replays, and the consent panel is excluded from replay. Confirm
retention and hosting in `privacy-readiness.md` before claiming legal readiness.
If collection purposes change, update both the disclosure and consent version.
