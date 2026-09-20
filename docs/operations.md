# Deployment and verification

The runtime stays Bun 1.3.14, TanStack Start, Vite and Nitro (`node-server`). React
and Radix provide the interface; Tailwind and its small utility packages provide
styling. LobeHub, Lucide, router devtools and the shadcn CLI dependency were removed.
The checked-in shadcn components remain usable without its CLI in production.
Rune normal SVGs are local React components; Artificial Analysis/Models.dev logos and Geist fonts are
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

The other benchmark pages use separate upstream snapshots, not the persisted
model catalogue. Artificial Analysis's `/agents/coding-agents` RSC response
contains a highlights array and a full `benchmarkRows` array. The JSON-only
parser resolves Flight property references to retain the full list; unresolved
references reject the snapshot. Component IDs and labels come from the source,
so Terminal-Bench v4 and DeepSWE v1.1 never overwrite historical v2/v1 fields.

DeepSWE reads its versioned public leaderboard artifacts. The default view keeps
the best measured effort per provider/model/harness; all efforts and historical
v1 results remain selectable. Published cost assumptions are preserved. Neither
missing harness names nor missing run counts are inferred. Both benchmark
sources have a six-hour process cache, shared in-flight requests, and a 30-second
retry cooldown after failures. An unavailable source is not cached as a successful
empty response for six hours. These caches are not stored in Redis.

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
with Models.dev fallbacks. Compound Devin Fusion configurations use the creator
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
