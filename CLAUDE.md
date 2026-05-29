<!-- BEGIN:tanstack-start-agent-rules -->
# Stack: TanStack Start (migrated off Next.js)

This app runs on **TanStack Start + TanStack Router + Vite**, deployed to
**Dokploy/Node** via Nitro. It is no longer a Next.js app.

Key conventions:
- File-based routes live in `src/routes/`; `__root.tsx` is the root layout.
- Server-side data fetching uses `createServerFn` (`lib/server-fns.ts`), called
  from route `loader`s. Components read data via `Route.useLoaderData()`.
- API endpoints are route files with `server.handlers` (e.g. `src/routes/api/...`).
- `lib/api.ts`, `lib/cron-cache.ts` and friends are **server-only** — never
  value-import them from client components (type-only imports are fine).
- Production environment variables come from `process.env`.
- The models cache persists to `MODELS_CACHE_FILE` (default:
  `.data/models-cache.json`); mount `/app/.data` in Dokploy if cache persistence
  across redeploys matters.
- There is no Worker scheduled handler in this branch. Configure a Dokploy
  Application Schedule Job that runs `npm run refresh-cache` inside the running
  container.
- Page metadata is set via each route's `head()` option.
- Check current API details against the docs before writing code — APIs may
  differ from training data.
<!-- END:tanstack-start-agent-rules -->
## Workflow Orchestration

### 1. Plan Node Default

- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately - don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy

- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One tack per subagent for focused execution

### 3. Self-Improvement Loop

- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done

- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)

- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes - don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fizing

- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests - then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

## Task Management

1. **Plan First**: Write plan to `tasks/todo.md` with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to `tasks/todo.md`
6. **Capture Lessons**: Update `tasks/lessons.md` after corrections

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimat Impact**: Changes should only touch what's necessary. Avoid introducing bugs.
