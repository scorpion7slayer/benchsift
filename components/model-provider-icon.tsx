import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
  Adobe,
  Ai2,
  AionLabs,
  Arcee,
  Aws,
  BAAI,
  Bfl,
  BriaAI,
  ByteDance,
  Coqui,
  Cursor,
  DeepCogito,
  ElevenLabs,
  EssentialAI,
  FishAudio,
  Haiper,
  Ideogram,
  Inception,
  Inflection,
  Kimi,
  Kling,
  Krea,
  KwaiKAT,
  Lightricks,
  Liquid,
  Luma,
  Midjourney,
  Morph,
  OpenChat,
  Pika,
  PixVerse,
  ProviderIcon,
  PrunaAI,
  Qwen,
  Recraft,
  Relace,
  Reve,
  Runway,
  Skywork,
  Stability,
  Vidu,
  ZAI,
} from "@lobehub/icons";

interface Props {
  provider: string;
  size?: number;
  iconUrl?: string | null;
}

function ProviderMonogram({ provider, size }: { provider: string; size: number }) {
  const initials = provider
    .split(/[-_\s]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "AI";
  return (
    <span
      role="img"
      aria-label={provider}
      className="inline-flex shrink-0 items-center justify-center rounded-md bg-primary/10 font-semibold text-primary"
      style={{ width: size, height: size, fontSize: Math.max(8, Math.round(size * 0.42)) }}
    >
      {initials}
    </span>
  );
}

function RemoteProviderIcon({
  provider,
  size,
  iconUrl,
}: {
  provider: string;
  size: number;
  iconUrl: string;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [iconUrl]);
  if (failed) return <ProviderMonogram provider={provider} size={size} />;
  return (
    <img
      src={iconUrl}
      width={size}
      height={size}
      alt={provider}
      className="rounded-md object-cover"
      onError={() => setFailed(true)}
    />
  );
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
 *  4. Monogramme déterministe pour les providers sans logo publié
 */
export function ModelProviderIcon({ provider, size = 20, iconUrl }: Props) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // Cas spéciaux : rendu direct quand ProviderIcon ne correspond pas au logo voulu.
  if (provider === "zai") return <ZAI.Avatar size={size} />;
  if (provider === "qwen") return <Qwen.Avatar size={size} />;
  if (provider === "kimi") return <Kimi.Avatar size={size} />;
  if (provider === "aws") return <Aws.Avatar size={size} />;
  if (provider === "kwaikat") return <KwaiKAT.Avatar size={size} />;
  if (provider === "inception") return <Inception.Avatar size={size} />;
  if (provider === "ai2") return <Ai2.Avatar size={size} />;
  if (provider === "liquidai") return <Liquid.Avatar size={size} />;
  if (provider === "deepcogito") return <DeepCogito.Avatar size={size} />;
  if (provider === "openchat") return <OpenChat.Avatar size={size} />;
  if (provider === "cursor") return <Cursor.Avatar size={size} />;
  if (provider === "adobe") return <Adobe.Avatar size={size} />;
  if (provider === "aionlabs") return <AionLabs.Avatar size={size} />;
  if (provider === "arcee") return <Arcee.Avatar size={size} />;
  if (provider === "baai") return <BAAI.Avatar size={size} />;
  if (provider === "bfl") return <Bfl.Avatar size={size} />;
  if (provider === "briaai") return <BriaAI.Avatar size={size} />;
  if (provider === "bytedance") return <ByteDance.Avatar size={size} />;
  if (provider === "coqui") return <Coqui.Avatar size={size} />;
  if (provider === "elevenlabs") return <ElevenLabs.Avatar size={size} />;
  if (provider === "essentialai") return <EssentialAI.Avatar size={size} />;
  if (provider === "fishaudio") return <FishAudio.Avatar size={size} />;
  if (provider === "haiper") return <Haiper.Avatar size={size} />;
  if (provider === "ideogram") return <Ideogram.Avatar size={size} />;
  if (provider === "inflection") return <Inflection.Avatar size={size} />;
  if (provider === "kling") return <Kling.Avatar size={size} />;
  if (provider === "krea") return <Krea.Avatar size={size} />;
  if (provider === "lightricks") return <Lightricks.Avatar size={size} />;
  if (provider === "luma") return <Luma.Avatar size={size} />;
  if (provider === "midjourney") return <Midjourney.Avatar size={size} />;
  if (provider === "morph") return <Morph.Avatar size={size} />;
  if (provider === "pika") return <Pika.Avatar size={size} />;
  if (provider === "pixverse") return <PixVerse.Avatar size={size} />;
  if (provider === "prunaai") return <PrunaAI.Avatar size={size} />;
  if (provider === "recraft") return <Recraft.Avatar size={size} />;
  if (provider === "relace") return <Relace.Avatar size={size} />;
  if (provider === "reve") return <Reve.Avatar size={size} />;
  if (provider === "runway") return <Runway.Avatar size={size} />;
  if (provider === "skywork") return <Skywork.Avatar size={size} />;
  if (provider === "stability") return <Stability.Avatar size={size} />;
  if (provider === "vidu") return <Vidu.Avatar size={size} />;

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

  if (iconUrl) {
    return <RemoteProviderIcon provider={provider} size={size} iconUrl={iconUrl} />;
  }

  // Last resort: keep every card visually identifiable without pretending a
  // generic robot is the provider's official logo.
  return <ProviderMonogram provider={provider} size={size} />;
}
