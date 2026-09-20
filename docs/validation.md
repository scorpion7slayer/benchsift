# Local validation — 15 September 2026

- Bun 1.3.14: 62 tests passed; strict TypeScript, production build, frozen-lockfile
  installation and `git diff --check` passed.
- Four direct dependencies removed. Package entries in the Bun lockfile fell
  from 1,111 to 305; this is dependency count, not a transfer-size measurement.
- The production build was served with a temporary copy of the existing real
  catalogue plus the live Models.dev canonical response. The original `.data`
  file and production catalogue were not refreshed. The local source snapshot
  predates the public catalogue, so their displayed counts are not comparable.
- Real Redis 7.2.7 was compiled in a temporary directory, bound only to loopback,
  and tested with Bun. A second process read the shared catalogue without a disk
  file. After Redis shutdown, disk fallback succeeded in about 7 ms; the next
  read reused the snapshot in about 0.12 ms. No global Redis installation or
  production service was created.
- On 100 local reads of the original 1.7 MB file, repeated file read/JSON parse
  averaged 1.90 ms; stat plus reused snapshot averaged 0.014 ms. This isolates
  catalogue reading and is not an end-to-end site performance benchmark.
- Before browser use was disabled by the updated project instructions, the
  local homepage was inspected at desktop width and 390 px, in French and
  English with the dark theme. At 390 px, scrollWidth equalled viewport width
  and the main element stayed inside it. Keyboard supplier filtering selected
  Anthropic, preserved global ranks and returned focus to the trigger.
- The public website was inspected read-only for comparison; it still loaded
  Google Fonts, both analytics scripts and a Rybbit replay script. Those URLs
  were absent from the local document. Public production was not changed.

Remaining browser verification: light theme, tablet, the full route matrix,
reduced-motion rendering and assistive technology. Final small keyboard/style
adjustments were source-tested after browser use was disabled. The legal and
infrastructure limitations are listed in `privacy-readiness.md`.

Final HTTP/SSR checks: homepage, catalogue, privacy/legal/accessibility pages and
one Models.dev detail returned 200 in both languages, with private cache headers.
Fonts and a provider logo returned 200; legal routes were in the sitemap. The
comparison rendered both selected Models.dev models. The unknown route returned
404 and unauthenticated refresh returned 401. Health correctly reported the old
local snapshot as stale and included sanitized Models.dev coverage.

Rybbit follow-up: restored only the confirmed `rybbit.nxtaigen.com` endpoint behind
versioned explicit consent. Seven regression tests cover expiry, no loading
before acceptance, refusal, repeated mounts, withdrawal, cross-tab/deleted cookie
synchronisation, opt-outs, preview hosts and blocked browser storage. The tests
use an instrumented window; they do not execute or send events to the live SDK.
Twenty-four production HTTP/SSR checks passed across `/`, `/privacy`, `/legal`
and `/accessibility`, both languages and all three consent states. All responses
were private, no-cache; no external analytics script or preconnect was present.
Footer preferences and the French hosting location appeared in the expected
pages. The same VPS hosts Rybbit, as confirmed by the publisher. Actual retention
remains unverified. No production settings or data were changed. Native dialog,
focus return, hydration and network behaviour still require browser verification
under the project's browser-use restriction.

## Other benchmarks and comparison follow-up

- All 73 tests across 20 files passed, including 11 new parser, version, grouping,
  missing-value, comparison-unit and bilingual-label regressions. TypeScript,
  the production build and `git diff --check` passed.
- Read-only live sources returned 15 full Artificial Analysis coding-agent rows
  (the highlights contained only 10), with DeepSWE v1.1, Terminal-Bench v4 and
  SWE-Atlas-QnA components. The DeepSWE v1.1 artifact contained 70 configurations
  across 113 tasks; grouping the best provider/model/harness effort produced 28
  rows. Counts describe the checked source snapshots, not seeded site data.
- Twenty-four production HTTP/SSR checks passed: `/compare` with zero, one,
  two and four real cached configurations, `/agents/coding` and
  `/benchmarks/deepswe`, each with French/English and light/dark preferences.
  They verified table/selection counts, current source versions, private cache
  headers and absence of a loaded analytics script. A temporary byte-for-byte
  copy of the original local catalogue remained unchanged.
- This follow-up did not automate a browser, as requested by the repository
  instructions. HTTP/SSR does not validate viewport geometry, hydration,
  keyboard interactions or rendered animations. Desktop/tablet/390 px checks,
  both themes/languages, keyboard and reduced-motion behaviour remain to be
  verified in a browser. No commit, publication or production refresh occurred.

## Performance, logos and unused-code audit — 20 September 2026

- Bun 1.3.14: all 79 tests in 22 files, strict TypeScript, the final production
  build and `git diff --check` passed. A separate frozen production install
  succeeded (233 packages, 117 MiB on this Mac). No dependency was added for
  the performance work.
- Knip was run with explicit TanStack routes, startup files, Bun tests and CSS
  entry coverage. After verifying its findings against imports, three unused
  source modules were removed: `harness-icon-lazy`, `ui/table` and `ui/toggle`
  (its used variants now live with ToggleGroup). Unused menu/card/select
  components, old all-model scraping entry points, their development Map,
  unnecessary exports and 11 unused comparison CSS rules/keyframes were removed.
  The final audit reports no unused source files, exports or dependencies in
  that configured graph. This does not prove every possible dead branch absent.
  The pre-existing untracked npm lockfile was preserved.
- The runtime Dockerfile no longer installs/copies a second production
  dependency tree or installs Bash/curl. The final `.output`, package manifest
  and refresh script ran from a temporary directory outside the repository,
  without project `node_modules`. Forty-two HTTP/SSR checks passed across nine
  routes, both languages and themes, authentication, health, 404 and logo cache
  headers. Docker itself could not be built/run: the local Docker daemon was
  unavailable. The 117 MiB figure is the removed local dependency tree, not a
  measured compressed image or RAM saving.
- The cache now retains at most 128 recent entries instead of 1,000, expires
  idle entries via one unreferenced timer, and preserves concurrent-request
  coalescing. Models.dev's temporary source snapshot is released after merging.
  File writes reuse the published object; matching Redis/file contents reuse a
  single parsed snapshot and retain a digest instead of the whole Redis string.
  Redis connection failures close the partially connected client.
- A separate-process cache workload loaded 1,000 distinct cloned records from
  the real local catalogue, with a one-second TTL. `bun:jsc` heapStats after
  synchronous collection measured retained heap above baseline of 1,357,531 B
  before versus 279,608 B after (about 79% less). After expiry, the deltas were
  1,349,439 B versus 84,632 B. These are targeted cache measurements, including
  harness overhead, not a claim about total site RAM.
- A separate 96-request SSR workload (four concurrent requests across home,
  directory, comparison and privacy) showed approximately 264 MiB resident
  memory both before and after this cleanup. Median response time was about
  14 ms in both runs; p95 was 20–23 ms. No total-process memory reduction was
  established. `--smol` was evaluated and left disabled because it did not show
  a consistent benefit. Linux/cgroup behaviour and peak refresh memory still
  need measurement in the actual Dokploy environment.
- Earlier in this work, a cold comparison response fell from about 16.2 seconds
  to 87 ms locally when cached measurements stopped waiting for supplementary
  upstream scraping. Supplementary details now arrive independently. This is
  an initial-response observation, not a production latency guarantee.
- With explicit local-browser permission, the homepage was checked at 390,
  768 and 1280 px in French/English and light/dark (12 combinations).
  `scrollWidth` matched each viewport, and the main content and all three latest
  model links remained within the viewport. The three links stack on mobile
  and align horizontally from tablet width. Reduced-motion checks recorded no
  running animation. Normal and Advanced modes, search and preserved ranks,
  provider filtering by keyboard with focus return, comparison add/remove by
  keyboard, shareable selection URLs and rapid theme changes were exercised.
- Browser QA caught and fixed the one-model “Differences only” empty-table case:
  removing the second model now leaves ten metric rows visible. The perpetual
  pagination spinner was replaced with a keyboard-operable Show more button;
  its activation expanded 32 rows to 64 while automatic scrolling still works.
- Coding Agents and DeepSWE were checked with real source responses on desktop
  and 390 px mobile, in both themes/languages across those checks. Devin Fusion
  displays both component logos; Muse Code/Muse Spark and OpenCode display their
  matching local artwork. The provider alias regression also covers AI21, Nous
  Research, ByteDance, TII and Kling, reusing existing assets. No broken loaded images or JavaScript console errors
  were observed in the final browser sessions. This is not a complete screen
  reader or WCAG certification audit.
- The real catalogue file and its temporary test copy have matching SHA-256
  hashes. No production refresh, external settings change, commit, push or
  deployment was performed. The local cache is historical and health correctly
  reports it as stale; live benchmark page counts belong to separate sources.

Documentation used: [Nitro standalone Node output](https://github.com/nitrojs/nitro/blob/main/docs/2.deploy/10.runtimes/1.node.md),
[TanStack Router data loading](https://tanstack.com/router/latest/docs/framework/react/guide/data-loading)
and [Bun runtime memory mode](https://bun.sh/docs/runtime).
Context7's general documentation was checked against installed Router 1.169.2,
Nitro 3.0.260522-beta, Bun 1.3.14 CLI help and the isolated output; no version
upgrade was made to match documentation examples.
