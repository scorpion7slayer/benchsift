/**
 * Mapping des slugs créateurs renvoyés par Artificial Analysis
 * vers les clés provider de @lobehub/icons.
 * Slugs réels récupérés via l'API : /data/llms/models
 */
const CREATOR_TO_PROVIDER: Record<string, string> = {
  // Big Labs
  openai: "openai",
  anthropic: "anthropic",
  google: "google",
  meta: "meta",
  mistral: "mistral",
  mistralai: "mistral",
  cohere: "cohere",
  deepseek: "deepseek",
  nvidia: "nvidia",
  xai: "xai",
  "x-ai": "xai",
  perplexity: "perplexity",

  // Cloud / infra
  amazon: "aws",            // Amazon Nova models → icône AWS
  aws: "aws",
  azure: "azure",
  "google-deepmind": "deepmind",
  ibm: "ibm",
  snowflake: "snowflake",

  // Chinese AI labs
  alibaba: "alibaba",
  zai: "zai",             // Z.AI (GLM) → ZAI.Avatar via ModelProviderIcon
  "z-ai": "zai",
  zhipu: "zhipu",
  baidu: "baidu",
  bytedance_seed: "bytedance", // ByteDance Seed team
  bytedance: "bytedance",
  minimax: "minimax",
  kimi: "moonshot",            // Kimi = Moonshot AI
  moonshot: "moonshot",
  moonshotai: "moonshot",      // AA uses "moonshotai" for Kimi rows / AA utilise "moonshotai"
  stepfun: "stepfun",
  xiaomi: "xiaomimimo",        // Xiaomi MiMo
  "ai21-labs": "ai21",
  ai21: "ai21",

  // Others with icons
  "nous-research": "nousresearch",
  nousresearch: "nousresearch",
  "tii-uae": "tii",            // Technology Innovation Institute UAE
  tii: "tii",
  upstage: "upstage",
  longcat: "longcat",
  lg: "lg",
  groq: "groq",

  // No direct icon → fallback to slug (ProviderIcon shows nothing gracefully)
  ai2: "ai2",                  // Allen Institute for AI
  databricks: "databricks",
  deepcogito: "deepcogito",
  inception: "inception",
  inclusionai: "inclusionai",
  "korea-telecom": "korea-telecom",
  kwaikat: "kwaikat",
  liquidai: "liquidai",
  mbzuai: "mbzuai",
  "motif-technologies": "motif-technologies",
  naver: "naver",
  openchat: "openchat",
  "prime-intellect": "prime-intellect",
  "reka-ai": "reka-ai",
  sarvam: "sarvam",
  servicenow: "servicenow",
  trillionlabs: "trillionlabs",
};

const CREATOR_CANONICAL_SLUG: Record<string, string> = {
  "z-ai": "zai",
  zhipu: "zai",
};

export function getCanonicalCreatorSlug(creatorSlug: string): string {
  const slug = creatorSlug.toLowerCase();
  return CREATOR_CANONICAL_SLUG[slug] ?? slug;
}

export function getProviderKey(creatorSlug: string): string {
  const slug = getCanonicalCreatorSlug(creatorSlug);
  return CREATOR_TO_PROVIDER[slug] ?? slug;
}

/**
 * Display name overrides for model creators when AA's API returns a brand
 * name that doesn't match the actual company (e.g. "Kimi" is the product,
 * Moonshot AI is the company that builds it).
 * Sur certains modèles AA renvoie le nom de produit au lieu du nom du créateur.
 */
const CREATOR_DISPLAY_NAME: Record<string, string> = {
  kimi: "Moonshot AI",
  moonshot: "Moonshot AI",
  moonshotai: "Moonshot AI",
  "bytedance-seed": "ByteDance",
  bytedance_seed: "ByteDance",
  zai: "Z.AI",
  zhipu: "Z.AI",
  "google-deepmind": "Google DeepMind",
  "ai21-labs": "AI21 Labs",
  "tii-uae": "TII",
  "nous-research": "Nous Research",
  "reka-ai": "Reka AI",
};

/** Returns the canonical display name for a creator, falling back to the API name. */
export function getCreatorDisplayName(slug: string, apiName: string): string {
  return CREATOR_DISPLAY_NAME[getCanonicalCreatorSlug(slug)] ?? apiName;
}

/**
 * Resolves the *real* creator of a model from its slug, when the API exposes
 * only the host/provider (e.g. AA coding-agents lists "friendliai" as the host
 * of GLM-5.1, but the creator is Z.AI; same for Composer 2 hosted by Cursor,
 * which is actually Cursor's own model).
 * Résout le vrai créateur d'un modèle depuis son slug, indépendamment de l'hôte.
 *
 * @param modelSlug — model identifier (e.g. "glm-5-1", "composer-2", "claude-opus-4-7")
 * @param hostFallback — host slug used when no pattern matches
 */
export function resolveCreatorFromModelSlug(modelSlug: string, hostFallback: string): string {
  const slug = modelSlug.toLowerCase();
  if (slug.startsWith("glm")) return "zai";
  if (slug.startsWith("composer")) return "cursor";
  if (slug.startsWith("claude")) return "anthropic";
  if (slug.startsWith("gpt") || slug.startsWith("o1") || slug.startsWith("o3") || slug.startsWith("o4")) return "openai";
  if (slug.startsWith("gemini")) return "google";
  if (slug.startsWith("kimi")) return "moonshot";
  if (slug.startsWith("deepseek")) return "deepseek";
  if (slug.startsWith("qwen") || slug.startsWith("qwq")) return "alibaba";
  if (slug.startsWith("llama")) return "meta";
  if (slug.startsWith("mistral") || slug.startsWith("mixtral") || slug.startsWith("codestral")) return "mistral";
  if (slug.startsWith("grok")) return "xai";
  if (slug.startsWith("mimo")) return "xiaomi";
  return hostFallback.toLowerCase();
}
