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
  cohere: "cohere",
  deepseek: "deepseek",
  nvidia: "nvidia",
  xai: "xai",
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
  zhipu: "zhipu",
  baidu: "baidu",
  bytedance_seed: "bytedance", // ByteDance Seed team
  bytedance: "bytedance",
  minimax: "minimax",
  kimi: "moonshot",            // Kimi = Moonshot AI
  moonshot: "moonshot",
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

export function getProviderKey(creatorSlug: string): string {
  const slug = creatorSlug.toLowerCase();
  return CREATOR_TO_PROVIDER[slug] ?? slug;
}
