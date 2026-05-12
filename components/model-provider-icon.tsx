"use client";

import { useTheme } from "next-themes";
import { ProviderIcon, ZAI, KwaiKAT, Inception, Ai2, Liquid, DeepCogito, OpenChat, Aws, Cursor } from "@lobehub/icons";
import { Bot } from "lucide-react";

interface Props {
  provider: string;
  size?: number;
}

/**
 * Logos SVGL pour les providers AI non couverts par @lobehub/icons.
 * Format : { light: url, dark: url } ou { light: url } si pas de variante sombre.
 * Source : https://svgl.app/docs/api
 */
const SVGL_ICONS: Record<string, { light: string; dark?: string }> = {
  // Ajouter ici les providers confirmés sur SVGL mais absents de @lobehub/icons
  // Exemple (si disponibles) :
  // "reka-ai":   { light: "https://svgl.app/library/reka.svg" },
  // "naver":     { light: "https://svgl.app/library/naver.svg" },
  // "ai2":       { light: "https://svgl.app/library/ai2-light.svg", dark: "https://svgl.app/library/ai2-dark.svg" },
};

/**
 * Ensemble des clés reconnues par @lobehub/icons ProviderIcon.
 * Générées depuis node_modules/@lobehub/icons/es/features/providerEnum.js
 */
const LOBEHUB_PROVIDERS = new Set([
  "ai21","ai302","ai360","aihubmix","aimass","aistudio","akashchat","alephalpha",
  "alibaba","alibabacloud","antgroup","anthropic","anyscale","apple","atlascloud",
  "aws","azure","azureai","baichuan","baidu","baiducloud","bailian","baseten",
  "bedrock","bfl","bilibili","burncloud","bytedance","centml","cerebras","civitai",
  "claude","cloudflare","cohere","cometapi","comfyui","copilot","crusoe","deepinfra",
  "deepmind","deepseek","doubao","exa","fal","featherless","fireworks","fireworksai",
  "friendli","gemini","giteeai","github","githubcopilot","google","googlecloud",
  "groq","higress","huawei","huaweicloud","huggingface","hunyuan","hyperbolic",
  "ibm","iflytekcloud","inference","infermatic","infiniai","infinigence","internlm",
  "jina","kluster","lambda","leptonai","lg","lmstudio","lobehub","longcat","menlo",
  "meta","microsoft","minimax","mistral","modelscope","moonshot","nebius","newapi",
  "nousresearch","novita","nplcloud","nvidia","ollama","ollamacloud","openai",
  "openrouter","parasail","perplexity","player2","ppio","qiniu","qwen","replicate",
  "sambanova","search1api","searchapi","sensenova","siliconcloud","snowflake",
  "sophnet","spark","stability","statecloud","stepfun","straico","streamlake",
  "submodel","taichu","targon","tencent","tencentcloud","tii","togetherai","upstage",
  "v0","vercel","vercelaigateway","vertexai","vllm","volcengine","wenxin","workersai",
  "xai","xiaomimimo","xinference","yandex","zenmux","zeroone","zhipu",
]);

/**
 * Affiche l'icône du provider AI :
 *  1. Cas spéciaux (ZAI)
 *  2. @lobehub/icons ProviderIcon pour les providers connus
 *  3. SVGL comme fallback SVG via <img>
 *  4. Icône générique Bot pour les providers inconnus
 */
export function ModelProviderIcon({ provider, size = 20 }: Props) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // Cas spécial : ZAI (pas dans ProviderIcon mais disponible en import direct)
  if (provider === "zai") return <ZAI.Avatar size={size} />;
  if (provider === "aws") return <Aws.Avatar size={size} />;
  if (provider === "kwaikat") return <KwaiKAT.Avatar size={size} />;
  if (provider === "inception") return <Inception.Avatar size={size} />;
  if (provider === "ai2") return <Ai2.Avatar size={size} />;
  if (provider === "liquidai") return <Liquid.Avatar size={size} />;
  if (provider === "deepcogito") return <DeepCogito.Avatar size={size} />;
  if (provider === "openchat") return <OpenChat.Avatar size={size} />;
  if (provider === "cursor") return <Cursor.Avatar size={size} />;

  // @lobehub/icons — couverture principale
  if (LOBEHUB_PROVIDERS.has(provider)) {
    return <ProviderIcon provider={provider} size={size} type="color" />;
  }

  // SVGL — fallback pour providers non couverts par @lobehub/icons
  const svgl = SVGL_ICONS[provider];
  if (svgl) {
    const url = isDark && svgl.dark ? svgl.dark : svgl.light;
    return (
      <img
        src={url}
        width={size}
        height={size}
        alt={provider}
        className="rounded-sm object-contain"
      />
    );
  }

  // Fallback générique
  return <Bot size={size} className="text-muted-foreground" />;
}
