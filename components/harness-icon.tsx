import {
  ClaudeCode, Cursor, OpenCode, Codex, OpenHands, Cline, Amp,
  Antigravity, Junie, Trae, Windsurf, GithubCopilot, Copilot,
  GeminiCLI, KiloCode, RooCode, Grok, Kimi,
} from "@lobehub/icons";
import { Terminal } from "lucide-react";

/**
 * Icon for coding-agent harnesses (Claude Code, Cursor CLI, OpenCode, …).
 * Falls back to a Terminal icon for unknown harnesses.
 */
export function HarnessIcon({ slug, size = 20 }: { slug: string; size?: number }) {
  const key = slug.toLowerCase();
  switch (key) {
    case "claudecode":
    case "claude-code":
      return <ClaudeCode.Avatar size={size} />;
    case "cursor":
    case "cursor-cli":
    case "cursorcli":
      return <Cursor.Avatar size={size} />;
    case "opencode":
      return <OpenCode.Avatar size={size} />;
    case "codex":
    case "codex-cli":
      return <Codex.Avatar size={size} />;
    case "openhands":
      return <OpenHands.Avatar size={size} />;
    case "cline":
      return <Cline.Avatar size={size} />;
    case "amp":
      return <Amp.Avatar size={size} />;
    case "antigravity":
      return <Antigravity.Avatar size={size} />;
    case "junie":
      return <Junie.Avatar size={size} />;
    case "trae":
      return <Trae.Avatar size={size} />;
    case "windsurf":
      return <Windsurf.Avatar size={size} />;
    case "githubcopilot":
    case "github-copilot":
      return <GithubCopilot.Avatar size={size} />;
    case "copilot":
      return <Copilot.Avatar size={size} />;
    case "geminicli":
    case "gemini-cli":
      return <GeminiCLI.Avatar size={size} />;
    case "kilocode":
    case "kilo-code":
      return <KiloCode.Avatar size={size} />;
    case "roocode":
    case "roo-code":
      return <RooCode.Avatar size={size} />;
    case "grok":
    case "grok-build":
      return <Grok.Avatar size={size} />;
    case "kimi":
    case "kimi-code":
    case "kimi-code-cli":
      return <Kimi.Avatar size={size} />;
    default:
      return <Terminal size={size} className="text-muted-foreground" />;
  }
}
