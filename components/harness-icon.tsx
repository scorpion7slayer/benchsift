import {
  ClaudeCode, Cursor, OpenCode, Codex, OpenHands, Cline, Amp,
  Antigravity, Junie, Trae, Windsurf, GithubCopilot, Copilot,
  GeminiCLI, KiloCode, RooCode, Grok, Kimi,
} from "@lobehub/icons";
import { Terminal } from "lucide-react";

const HARNESS_AVATARS = {
  claudecode: ClaudeCode.Avatar,
  "claude-code": ClaudeCode.Avatar,
  cursor: Cursor.Avatar,
  "cursor-cli": Cursor.Avatar,
  cursorcli: Cursor.Avatar,
  opencode: OpenCode.Avatar,
  codex: Codex.Avatar,
  "codex-cli": Codex.Avatar,
  openhands: OpenHands.Avatar,
  cline: Cline.Avatar,
  amp: Amp.Avatar,
  antigravity: Antigravity.Avatar,
  junie: Junie.Avatar,
  trae: Trae.Avatar,
  windsurf: Windsurf.Avatar,
  githubcopilot: GithubCopilot.Avatar,
  "github-copilot": GithubCopilot.Avatar,
  copilot: Copilot.Avatar,
  geminicli: GeminiCLI.Avatar,
  "gemini-cli": GeminiCLI.Avatar,
  kilocode: KiloCode.Avatar,
  "kilo-code": KiloCode.Avatar,
  roocode: RooCode.Avatar,
  "roo-code": RooCode.Avatar,
  grok: Grok.Avatar,
  "grok-build": Grok.Avatar,
  kimi: Kimi.Avatar,
  "kimi-code": Kimi.Avatar,
  "kimi-code-cli": Kimi.Avatar,
} as const;

/**
 * Icon for coding-agent harnesses (Claude Code, Cursor CLI, OpenCode, …).
 * Falls back to a Terminal icon for unknown harnesses.
 */
export function HarnessIcon({ slug, size = 20 }: { slug: string; size?: number }) {
  const key = slug.toLowerCase();
  const Avatar = HARNESS_AVATARS[key as keyof typeof HARNESS_AVATARS];
  return Avatar
    ? <Avatar size={size} />
    : <Terminal size={size} className="text-muted-foreground" />;
}
