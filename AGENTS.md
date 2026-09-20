# BenchSift repository guide

BenchSift is an evidence-first AI model catalogue. These instructions apply to
this repository.

## Working context

Use **Bun**, including `bun install`, `bun test`, and `bun run <script>`.
The app uses TanStack Start/Router, React, TypeScript, Tailwind v4 and Radix-based
shadcn/ui. Nitro builds the `node-server` output that Bun runs in Docker/Dokploy.
`package.json`, `vite.config.ts`, `Dockerfile`, and source code define the current
stack and commands.

Consult references when the task needs them:

- [README.md](README.md): local setup and repository map.
- [PRODUCT.md](PRODUCT.md): UI decisions, language, accessibility, and interaction goals.
- [DOKPLOY.md](DOKPLOY.md): deployment, cache persistence, refresh, and health checks.
- [SECURITY.md](SECURITY.md): vulnerability reporting and security review scope.
- [.agents/skills/shadcn/SKILL.md](.agents/skills/shadcn/SKILL.md): adding, updating,
  or composing shadcn components and changing registry or preset configuration.

## Data contracts

- Use real source data. Keep unavailable metrics as `null`, not zero, `Unknown`,
  or a guessed fallback; zero is data unless a source contract says otherwise.
- Artificial Analysis owns model identity, benchmark measurements, speed,
  latency, and its published pricing. OpenRouter enriches capabilities, pricing
  detail, rankings, and models absent from AA. Hugging Face supplies official
  repository metadata and open-weight evidence.
- Merge duplicates by source authority: keep first-party identity and AA
  measurements, refresh OpenRouter-owned fields from the matching entry, fill
  missing fields, then remove the redundant row. Hiding a row loses data.
- Apply normalization and exclusions to fresh ingestion **and historical cache
  reads**. The catalogue is cumulative; a live-fetch-only fix lets stale entries return.
- Reuse `lib/provider-map.ts` for creators/providers and
  `lib/openrouter-model-filter.ts` for routers, services, moving `*-latest`
  aliases, and `:free` endpoints. A host or family name does not establish ownership.
- Trace external-data bugs to the actual source objects and cache path.
  Preserve the source-count and partial-build safeguards in `lib/api.ts` so a
  refresh cannot silently replace a healthy cache with incomplete results.
- Validate and encode external slugs; reuse bounded retry/timeout helpers for
  idempotent upstream requests.

## Runtime boundaries

- Route loaders call server functions in `lib/server-fns.ts`. Keep Node APIs,
  secrets, filesystem state, and upstream fetching on the server; retain
  `@tanstack/react-start/server-only` guards on dedicated server modules.
  Client code may import their types, but not their runtime values.
- Read server configuration from `process.env`. Public payloads must omit keys,
  `CRON_SECRET`, cache paths, schema keys, and internal errors.
- Keep initial SSR and client renders structurally identical. Access browser
  globals after hydration or in effects/event handlers.
- Both cron endpoints require `Authorization: Bearer <CRON_SECRET>`.
  `/health` is public liveness with sanitized catalogue state; a degraded
  catalogue does not by itself make the HTTP check fail.
- `.data/` is uncommitted runtime state. `src/routeTree.gen.ts` and `.output/`
  are generated; edit their sources instead.

## Product contracts

- Keep French and English copy in parity in `lib/i18n.tsx`. Reuse semantic
  tokens in `src/styles/globals.css`, `components/ui/`, and `cn()`.
- Normal mode is the compact ranking and collapses reasoning variants;
  Advanced and detail flows can expose the full family. Keep filters and
  provider selection consistent without renumbering global ranks after filtering.
- Preserve shareable comparison/selection URL state. Use `components/link.tsx`
  for internal navigation unless a Router API requires its native component.
- Preserve the warm-neutral identity and accessibility requirements in
  [PRODUCT.md](PRODUCT.md), including keyboard use and reduced motion.

## Scope and completion

Start with `git status -sb` and preserve unrelated changes. Complete the requested
local implementation, relevant verification, and fixes for failures it causes;
these steps do not require separate approvals. Ask when missing information
materially changes the result or an action exceeds the authorized scope.
Commit, push, deployment, production refresh, and external mutations require an
explicit user request for that action; authorization already given in the task
remains valid.

Use validation that can detect regressions in the affected behavior:

| Change | Evidence |
| --- | --- |
| Documentation only | Check commands, links, consistency, and `git diff --check`. |
| Code or data pipeline | `bun test`, `bun run typecheck`, `bun run build`, `git diff --check`. Add focused `lib/*.test.mjs` coverage for parser, matching, filtering, ranking, cache, or normalization changes. |
| Routes or server behavior | Also smoke-test the relevant HTTP/SSR path from the production build. |
| Responsive UI | Browser QA in both themes and languages at mobile (including 390 px), tablet, and desktop widths; keyboard navigation, `scrollWidth`, and critical element bounds. |
| Dependencies or lockfile | Also run `bun install --frozen-lockfile` with the Bun family used by Docker. |

A real cache or deployed app is needed to verify data-backed UI; an empty shell
is insufficient. Once relevant checks pass, repeat them only after changes or
new evidence. Report changes, validation, and remaining limitations; distinguish
local results from any GitHub, deployment, refresh, or public-production checks.
