# Instructions for BenchSift agents

BenchSift is an evidence-first catalogue for finding and comparing AI models.
These rules apply throughout the repository. Read linked guides when the task
touches their subject; the source and `package.json` define current behavior.

## Start and scope

- Run `git status -sb` before editing. Preserve unrelated work, including
  untracked files. Complete the requested local change and its verification.
- Use Bun for installation, scripts, and tests (`bun install`, `bun test`,
  `bun run <script>`); do not use npm. Match the Bun version in `package.json`
  and `Dockerfile` when checking the lockfile.
- Ask only when missing information materially changes the result or the action
  exceeds the request. A commit, push, deployment, production refresh, or
  mutation of an external service requires an explicit user request; earlier
  authorization in the conversation still counts.
- Treat `.data/` as local runtime state. Do not hand-edit generated
  `src/routeTree.gen.ts` or `.output/` files.

## Data integrity

- Show only sourced data. An unavailable metric is `null`, never a fabricated
  value, `Unknown`, or zero; zero is a measurement unless its source says otherwise.
- Artificial Analysis is authoritative for model identity, benchmarks, speed,
  latency, and its published prices. OpenRouter adds capabilities, pricing
  detail, rankings, and models missing from AA. Hugging Face provides official
  repository metadata and evidence about open weights.
- Resolve duplicate models by field ownership: retain first-party identity
  and AA measurements, update OpenRouter-owned fields from the matching entry,
  fill remaining gaps, then remove the redundant row. Do not merely hide it.
- Apply normalization and exclusions both during ingestion and when reading
  historical caches. Reuse `lib/provider-map.ts` for creator/provider identity
  and `lib/openrouter-model-filter.ts` for routers, services, moving `*-latest`
  aliases, and `:free` endpoints. A host or model family alone is not ownership
  evidence.
- When external data looks wrong, inspect source objects and the cache path.
  Preserve the source-count and partial-build protections in `lib/api.ts` so an
  incomplete refresh cannot replace a healthy catalogue. Validate and encode
  external slugs; use bounded retries and timeouts for idempotent requests.

## Server and public boundaries

- Route loaders use server functions in `lib/server-fns.ts`. Keep Node APIs,
  filesystem access, secrets, and upstream requests on the server. Preserve
  `@tanstack/react-start/server-only` guards on dedicated server modules;
  client code may import types from them, never runtime values.
- Read server configuration from `process.env`. Public responses and logs must
  not expose keys, `CRON_SECRET`, cache paths, schema keys, or internal errors.
- Initial SSR and client render must have the same structure. Read browser
  globals after hydration or inside effects and event handlers.
- `/api/cron/refresh` and `/api/cron/status` require
  `Authorization: Bearer <CRON_SECRET>`. `/health` is public liveness with
  sanitized catalogue status; degraded data alone must not fail the HTTP check.

## Product behavior

- Keep French and English text in parity in `lib/i18n.tsx`. Reuse semantic
  tokens from `src/styles/globals.css`, `components/ui/`, and `cn()`.
- Normal mode shows a compact ranking and collapses reasoning variants;
  Advanced and detail views may expose the family. Filters and provider
  selection must not renumber global ranks.
- Preserve shareable filter, selection, and comparison state in URLs. Use
  `components/link.tsx` for internal links unless the Router API needs its own.
- Follow [PRODUCT.md](PRODUCT.md) for the warm-neutral visual language,
  mobile usability, keyboard access, visible focus, and reduced motion.

## Verification and handoff

- Documentation: check referenced commands and links, consistency, and
  `git diff --check`.
- Code or data: run `bun test`, `bun run typecheck`, `bun run build`, and
  `git diff --check`. Add focused `lib/*.test.mjs` coverage when changing
  parsing, matching, filtering, ranking, cache, or normalization logic.
- Routes or server behavior: additionally smoke-test the affected HTTP/SSR
  path from the production build.
- Responsive UI: check both themes and languages at 390 px mobile, tablet,
  and desktop widths; verify keyboard navigation, `scrollWidth`, and critical
  element bounds. Data-backed views need a real cache or deployed catalogue;
  an empty shell is not evidence.
- Dependencies or lockfile: also run `bun install --frozen-lockfile` with the
  Bun family used by Docker.
- After checks pass, repeat them only for new changes or failures. Report what
  changed, what was verified, and any limits; distinguish local checks from
  GitHub, deployment, refresh, and public-production checks.

Read [README.md](README.md) for setup and the repository map,
[DOKPLOY.md](DOKPLOY.md) for operations, and [SECURITY.md](SECURITY.md) for
security scope. When adding or configuring shadcn components, use
[the local shadcn skill](.agents/skills/shadcn/SKILL.md).
