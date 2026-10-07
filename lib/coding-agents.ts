// Coding Agents (AA Coding Agent Index) — shared types + static metadata.
//
// Client-safe: this module has no server-only dependencies, so both the
// scraping logic in `lib/api.ts` and the `CodingAgentsTable` client component
// can import from it.

export interface CodingAgent {
  id: string; // unique row id from AA
  agent_name: string; // harness name (Claude Code, Cursor CLI…)
  agent_slug: string; // harness slug for icon lookup
  agent_creator_slug: string | null;
  models: Array<{ name: string; creator: string | null }>;
  display_label: string; // "Claude Code - Opus 4.7 (Medium)"
  model_name: string; // underlying model name (full)
  model_short: string; // shorter display name
  model_slug: string; // underlying model slug
  model_creator_slug: string; // for provider icon
  release_date: string | null; // ISO date
  coding_agent_index: number | null; // composite 0-100 (× 100 from raw 0-1)
  benchmark_scores: Array<{ id: string; label: string; value: number | null }>;
  deep_swe: number | null; // pass@1 (0-1)
  terminal_bench_v2: number | null; // pass@1 (0-1)
  swe_atlas_qna: number | null; // pass@1 (0-1)
  cost_per_task_usd: number | null; // USD per task
  time_per_task_seconds: number | null; // wall time per task
  input_tokens_per_task: number | null;
  cached_input_tokens_per_task: number | null;
  output_tokens_per_task: number | null;
  total_tokens_per_task: number | null;
  cache_hit_rate: number | null; // 0-1
  steps_per_task: number | null;
}

/** Logo owner of each harness family; versioned slugs match by prefix. */
const HARNESS_PROVIDERS: Record<string, string> = {
  "claude-code": "anthropic",
  claudecode: "anthropic",
  codex: "openai",
  "codex-cli": "openai",
  cursor: "cursor",
  "cursor-cli": "cursor",
  "gemini-cli": "google",
  geminicli: "google",
  antigravity: "google",
  "github-copilot": "github-copilot",
  githubcopilot: "github-copilot",
  copilot: "github-copilot",
  "grok-build": "xai",
  grok: "xai",
  "kimi-code": "moonshotai",
  "kimi-code-cli": "moonshotai",
  kimi: "moonshotai",
  devin: "cognition",
  "devin-fusion-cli": "cognition",
  "muse-code": "meta",
  opencode: "opencode",
};

/**
 * The provider whose logo represents a harness. AA versions some harness
 * slugs ("muse-code-102-rc", "antigravity-sdk-v0112"), so the longest known
 * prefix wins; an explicit creator from the source takes precedence.
 */
export function harnessProvider(slug: string, creator?: string | null): string {
  if (creator) return creator;
  const key = slug.toLowerCase();
  if (HARNESS_PROVIDERS[key]) return HARNESS_PROVIDERS[key];
  const prefix = Object.keys(HARNESS_PROVIDERS)
    .filter((candidate) => key.startsWith(`${candidate}-`))
    .sort((a, b) => b.length - a.length)[0];
  return prefix ? HARNESS_PROVIDERS[prefix] : key;
}

const EFFORT_PATTERN = /\s*(?:\(\s*(minimal|low|medium|high|xhigh|max)\s*\)|\b(minimal|low|medium|high|xhigh|max)\b)/i;

/** "Sonnet 5.5 (max)" → { base: "Sonnet 5.5", effort: "max" }; names without an effort keep it null. */
export function splitEffort(name: string): { base: string; effort: string | null } {
  const match = name.match(EFFORT_PATTERN);
  if (!match || match.index == null) return { base: name.trim(), effort: null };
  const base = `${name.slice(0, match.index)}${name.slice(match.index + match[0].length)}`.replace(/\s+/g, " ").trim();
  return { base, effort: (match[1] ?? match[2]).toLowerCase() };
}
