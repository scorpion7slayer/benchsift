// Coding Agents (AA Coding Agent Index) — shared types + static metadata.
//
// Client-safe: this module has no server-only dependencies, so both the
// scraping logic in `lib/api.ts` and the `CodingAgentsTable` client component
// can import from it.

export interface CodingAgent {
  id: string; // unique row id from AA
  agent_name: string; // harness name (Claude Code, Cursor CLI…)
  agent_slug: string; // harness slug for icon lookup
  display_label: string; // "Claude Code - Opus 4.7 (Medium)"
  model_name: string; // underlying model name (full)
  model_short: string; // shorter display name
  model_slug: string; // underlying model slug
  model_creator_slug: string; // for provider icon
  release_date: string | null; // ISO date
  coding_agent_index: number | null; // composite 0-100 (× 100 from raw 0-1)
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

/**
 * Known coding-agent harnesses with their @lobehub/icons keys.
 * Harnais connus avec leurs clés d'icônes @lobehub/icons.
 */
export const CODING_AGENT_HARNESSES: Record<string, { name: string; icon: string }> = {
  "claude-code":   { name: "Claude Code",   icon: "claudecode" },
  "cursor-cli":    { name: "Cursor CLI",    icon: "cursor" },
  "cursor":        { name: "Cursor",        icon: "cursor" },
  "opencode":      { name: "OpenCode",      icon: "opencode" },
  "codex":         { name: "Codex CLI",     icon: "codex" },
  "codex-cli":     { name: "Codex CLI",     icon: "codex" },
  "openhands":     { name: "OpenHands",     icon: "openhands" },
  "cline":         { name: "Cline",         icon: "cline" },
  "amp":           { name: "Amp",           icon: "amp" },
  "antigravity":   { name: "Antigravity",   icon: "antigravity" },
  "junie":         { name: "Junie",         icon: "junie" },
  "trae":          { name: "Trae",          icon: "trae" },
  "windsurf":      { name: "Windsurf",      icon: "windsurf" },
  "github-copilot": { name: "GitHub Copilot", icon: "githubcopilot" },
  "copilot":       { name: "Copilot",       icon: "copilot" },
  "gemini-cli":    { name: "Gemini CLI",    icon: "geminicli" },
  "kilo-code":     { name: "KiloCode",      icon: "kilocode" },
  "roo-code":      { name: "RooCode",       icon: "roocode" },
  "grok-build":    { name: "Grok Build",    icon: "grok" },
  "kimi-code-cli": { name: "Kimi Code CLI", icon: "kimi" },
};
