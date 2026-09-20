import { ModelProviderIcon } from "@/components/model-provider-icon";

const harnessProviders: Record<string, string> = {
  claudecode: "anthropic",
  "claude-code": "anthropic",
  "cursor-cli": "cursor",
  cursorcli: "cursor",
  codex: "openai",
  "codex-cli": "openai",
  geminicli: "google",
  "gemini-cli": "google",
  githubcopilot: "github-copilot",
  copilot: "github-copilot",
  "grok-build": "xai",
  grok: "xai",
  "kimi-code": "moonshotai",
  "kimi-code-cli": "moonshotai",
  kimi: "moonshotai",
  "devin-fusion-cli": "cognition",
  "muse-code": "meta",
  opencode: "opencode",
};
export function HarnessIcon({
  slug,
  size = 20,
  creator,
}: {
  slug: string;
  size?: number;
  creator?: string | null;
}) {
  return (
    <ModelProviderIcon
      provider={
        creator ?? harnessProviders[slug.toLowerCase()] ?? slug.toLowerCase()
      }
      size={size}
    />
  );
}
