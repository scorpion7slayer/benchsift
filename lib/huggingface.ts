import type { LLMModel } from "@/lib/api";

const HF_BASE = "https://huggingface.co";
const HF_API_BASE = `${HF_BASE}/api/models`;
const HF_API_TIMEOUT_MS = 5_000;
const OPEN_LICENSE_TAGS = new Set([
  "apache-2.0",
  "mit",
  "bsd-2-clause",
  "bsd-3-clause",
  "cc-by-4.0",
  "cc-by-sa-4.0",
  "cc0-1.0",
  "openrail",
  "bigscience-openrail-m",
  "creativeml-openrail-m",
  "gemma",
  "llama2",
  "llama3",
  "llama3.1",
  "llama3.2",
  "llama3.3",
  "qwen-research",
  "other",
]);

interface HuggingFaceModelInfo {
  id?: string;
  private?: boolean;
  gated?: boolean | string;
  disabled?: boolean;
  downloads?: number;
  likes?: number;
  pipeline_tag?: string;
  library_name?: string;
  tags?: string[];
  cardData?: {
    license?: string;
    license_name?: string;
    license_link?: string;
    pipeline_tag?: string;
    library_name?: string;
  };
}

export interface HuggingFaceEnrichmentOptions {
  apiKey?: string;
}

function fetchWithTimeout(
  input: string | URL | Request,
  init: RequestInit = {},
  timeoutMs = HF_API_TIMEOUT_MS,
): Promise<Response> {
  return fetch(input, {
    ...init,
    signal: init.signal ?? AbortSignal.timeout(timeoutMs),
  });
}

function huggingFaceHeaders(apiKey?: string): HeadersInit {
  return {
    ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
  };
}

function huggingFaceModelApiUrl(repoId: string): string {
  return `${HF_API_BASE}/${repoId.split("/").map(encodeURIComponent).join("/")}`;
}

function normaliseLicense(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.trim().toLowerCase();
}

function tagLicense(tags: string[] | undefined): string | null {
  const licenseTag = tags?.find((tag) => tag.startsWith("license:"));
  return normaliseLicense(licenseTag?.replace(/^license:/, ""));
}

function inferOpenSource(info: HuggingFaceModelInfo, license: string | null): boolean | undefined {
  if (info.private || info.disabled) return false;
  if (info.gated === "manual" || info.gated === true) return false;
  if (!license) return undefined;
  if (OPEN_LICENSE_TAGS.has(license)) return true;
  return undefined;
}

async function getHuggingFaceModelInfo(
  repoId: string,
  officialOrgs: Set<string>,
  apiKey?: string,
): Promise<Partial<LLMModel>> {
  const requestedOrg = repoId.split("/")[0]?.toLowerCase();
  const requestedOfficial = Boolean(requestedOrg && officialOrgs.has(requestedOrg));
  try {
    const res = await fetchWithTimeout(
      huggingFaceModelApiUrl(repoId),
      { headers: huggingFaceHeaders(apiKey) },
    );
    if (!res.ok) {
      return {
        huggingface_id: repoId,
        huggingface_url: null,
        huggingface_official: false,
      };
    }

    const info = (await res.json()) as HuggingFaceModelInfo;
    const license =
      normaliseLicense(info.cardData?.license) ??
      normaliseLicense(info.cardData?.license_name) ??
      tagLicense(info.tags);
    const verifiedId = info.id ?? repoId;
    const verifiedOrg = verifiedId.split("/")[0]?.toLowerCase();
    const official = Boolean(
      requestedOfficial &&
      verifiedOrg &&
      officialOrgs.has(verifiedOrg),
    );

    return {
      huggingface_id: verifiedId,
      huggingface_url: official ? `${HF_BASE}/${verifiedId}` : null,
      huggingface_official: official,
      huggingface_license: license,
      huggingface_downloads: typeof info.downloads === "number" ? info.downloads : null,
      huggingface_likes: typeof info.likes === "number" ? info.likes : null,
      huggingface_pipeline_tag: info.pipeline_tag ?? info.cardData?.pipeline_tag ?? null,
      huggingface_library_name: info.library_name ?? info.cardData?.library_name ?? null,
      huggingface_tags: info.tags?.slice(0, 24) ?? undefined,
      huggingface_gated: typeof info.gated === "string" ? info.gated : info.gated === true ? "gated" : null,
      huggingface_private: info.private ?? null,
      is_open_weights: inferOpenSource(info, license),
    };
  } catch {
    return {
      huggingface_id: repoId,
      huggingface_url: null,
      huggingface_official: false,
    };
  }
}

function mergeDefinedModel(model: LLMModel, patch: Partial<LLMModel>): LLMModel {
  const next = { ...model };
  for (const [key, value] of Object.entries(patch)) {
    if (key === "is_open_weights" && model.is_open_weights === true && value === false) {
      continue;
    }
    if (value !== undefined && (value !== null || key.startsWith("huggingface_"))) {
      (next as Record<string, unknown>)[key] = value;
    }
  }
  return next;
}

// Creators we trust to publish their weights on the Hub. Open-weight models
// always search Hugging Face; this set only covers likely-open models before
// AA exposes an explicit open-weights badge.
const OPEN_SOURCE_CREATOR_SLUGS = new Set([
  "google", "meta", "meta-llama", "mistral", "mistralai", "qwen", "alibaba",
  "deepseek", "deepseek-ai", "ai21", "anthropic-research", "01-ai", "01ai",
  "yi", "cohere", "cohereforai", "ibm", "ibm-granite", "nvidia", "snowflake",
  "tii", "tiiuae", "microsoft", "stability", "stabilityai", "perplexity",
  "moonshot", "moonshotai", "zhipu", "zhipuai", "thudm", "baichuan",
  "huggingface", "huggingfaceh4", "openchat", "nous", "nousresearch",
  "minimax", "minimaxai", "internlm", "shanghaiailab", "bigcode",
  "salesforce", "allenai", "ai2", "olm", "lg-ai", "lgai", "kakaobrain",
  "xai", "x-ai", "elutherai", "eleutherai", "bigscience", "mosaicml",
  "databricks", "smol", "smollm", "openpipe", "ainstein", "amazon",
  "openai",
]);

interface HuggingFaceSearchHit {
  id?: string;
  downloads?: number;
  likes?: number;
  private?: boolean;
  gated?: boolean | string;
}

function normaliseForCompare(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function dottedVersionSlug(value: string): string {
  return value.replace(/-(\d)-(\d)(?=-|$)/g, "-$1.$2");
}

function huggingFaceSearchSlugs(modelSlug: string, modelName?: string): string[] {
  const slugs = new Set<string>();
  const baseSlug = modelSlug.replace(/-(?:low|medium|high)$/i, "");
  slugs.add(modelSlug);
  slugs.add(baseSlug);
  slugs.add(dottedVersionSlug(modelSlug));
  slugs.add(dottedVersionSlug(baseSlug));
  if (modelName) {
    slugs.add(modelName);
    slugs.add(modelName.replace(/\s+/g, "-"));
  }
  return [...slugs].filter(Boolean);
}

const OFFICIAL_ORG_ALIASES: Record<string, string[]> = {
  meta: ["meta-llama"],
  mistral: ["mistralai"],
  deepseek: ["deepseek-ai"],
  alibaba: ["Qwen"],
  qwen: ["Qwen"],
  stability: ["stabilityai"],
  cohere: ["CohereForAI", "CohereLabs"],
  moonshot: ["moonshotai"],
  ibm: ["ibm-granite", "ibm"],
  nvidia: ["nvidia"],
  yi: ["01-ai"],
  "01ai": ["01-ai"],
  zhipu: ["zai-org", "THUDM"],
  zhipuai: ["zai-org", "THUDM"],
  minimax: ["MiniMaxAI"],
  minimaxai: ["MiniMaxAI"],
  openai: ["openai"],
};

function officialOrgsForCreator(creatorSlug: string): Set<string> {
  const candidateOrgs = new Set<string>();
  candidateOrgs.add(creatorSlug);
  (OFFICIAL_ORG_ALIASES[creatorSlug] ?? []).forEach((alias) => candidateOrgs.add(alias));
  return new Set([...candidateOrgs].map((org) => org.toLowerCase()));
}

function knownOfficialRepo(model: LLMModel): string | null {
  const creatorSlug = model.model_creator.slug.toLowerCase();
  const baseSlug = model.slug.replace(/-(?:low|medium|high)$/i, "");

  if (creatorSlug === "openai") {
    const match = baseSlug.match(/^gpt-oss-(20b|120b)$/i);
    if (match) return `openai/gpt-oss-${match[1].toLowerCase()}`;
  }

  return null;
}

export function attachOfficialHuggingFaceHints(models: LLMModel[]): LLMModel[] {
  return models.map((model) => {
    const creatorSlug = model.model_creator.slug.toLowerCase();
    const officialOrgs = officialOrgsForCreator(creatorSlug);
    const repoId = model.huggingface_id ?? knownOfficialRepo(model);
    if (!repoId) return model;

    const repoOrg = repoId.split("/")[0]?.toLowerCase();
    const official = Boolean(repoOrg && officialOrgs.has(repoOrg));
    return {
      ...model,
      huggingface_id: repoId,
      huggingface_url: official ? `${HF_BASE}/${repoId}` : null,
      huggingface_official: official,
      huggingface_source: official
        ? model.huggingface_source ?? "official_hint"
        : model.huggingface_source,
    };
  });
}

async function searchHuggingFaceRepo(
  creatorSlug: string,
  modelSlug: string,
  modelName?: string,
  apiKey?: string,
): Promise<string | null> {
  const candidateOrgs = officialOrgsForCreator(creatorSlug);
  const candidateSlugs = huggingFaceSearchSlugs(modelSlug, modelName);

  for (const org of candidateOrgs) {
    for (const slug of candidateSlugs) {
      try {
        const url = `${HF_API_BASE}?search=${encodeURIComponent(`${org}/${slug}`)}&limit=8`;
        const res = await fetchWithTimeout(url, { headers: huggingFaceHeaders(apiKey) }, HF_API_TIMEOUT_MS);
        if (!res.ok) continue;
        const hits = (await res.json()) as HuggingFaceSearchHit[];
        const normalizedTarget = normaliseForCompare(slug);
        // Rank: prefer exact-name match in correct org, then any contains-match, then highest downloads.
        const scored = hits
          .filter((h) => typeof h.id === "string" && h.id.length > 0)
          .map((hit) => {
            const id = hit.id as string;
            const [hitOrg, ...rest] = id.split("/");
            if (hitOrg.toLowerCase() !== org.toLowerCase()) return null;
            const repoName = rest.join("/");
            const normalizedRepo = normaliseForCompare(repoName);
            let score = 0;
            score += 100;
            if (normalizedRepo === normalizedTarget) score += 100;
            else if (normalizedRepo.startsWith(normalizedTarget)) score += 60;
            else if (normalizedRepo.includes(normalizedTarget)) score += 30;
            // Boost popular repos as a tiebreaker.
            if (typeof hit.downloads === "number") score += Math.min(20, Math.log10(hit.downloads + 1) * 5);
            return { id, score };
          })
          .filter((row): row is { id: string; score: number } => row !== null)
          .filter((row) => row.score >= 60)
          .sort((a, b) => b.score - a.score);
        if (scored.length > 0) return scored[0].id;
      } catch {
        // try next candidate
      }
    }
  }
  return null;
}

function shouldSearchHuggingFace(model: LLMModel): boolean {
  const creatorSlug = model.model_creator.slug.toLowerCase();
  const officialOrgs = officialOrgsForCreator(creatorSlug);
  const existingOrg = model.huggingface_id?.split("/")[0]?.toLowerCase();
  const hasOfficialRepo = Boolean(existingOrg && officialOrgs.has(existingOrg));

  if (model.is_open_weights === true) return !hasOfficialRepo;
  if (model.huggingface_id) return false;
  return OPEN_SOURCE_CREATOR_SLUGS.has(creatorSlug);
}

export async function enrichModelsWithHuggingFace(
  models: LLMModel[],
  options: HuggingFaceEnrichmentOptions = {},
): Promise<LLMModel[]> {
  const hintedModels = attachOfficialHuggingFaceHints(models);

  // Phase 1 — every open-weight model without an official HF repo gets a Hub
  // search. For models without the AA badge yet, fall back to trusted creators.
  const searchable = hintedModels
    .map((model, index) => ({ model, index }))
    .filter(({ model }) => shouldSearchHuggingFace(model));

  const inferredIds = new Map<number, string>();
  const searchBatchSize = 4;
  for (let i = 0; i < searchable.length; i += searchBatchSize) {
    const batch = searchable.slice(i, i + searchBatchSize);
    const settled = await Promise.allSettled(
      batch.map(({ model }) =>
        searchHuggingFaceRepo(
          model.model_creator.slug.toLowerCase(),
          model.slug,
          model.name,
          options.apiKey,
        ),
      ),
    );
    settled.forEach((result, j) => {
      if (result.status === "fulfilled" && result.value) {
        inferredIds.set(batch[j].index, result.value);
      }
    });
  }

  // Apply the inferred ids before phase 2 so the metadata fetch picks them up.
  const modelsWithInferred = hintedModels.map((model, index) => {
    const inferred = inferredIds.get(index);
    if (!inferred) return model;
    return {
      ...model,
      huggingface_id: inferred,
      huggingface_url: `${HF_BASE}/${inferred}`,
      huggingface_source: "official_search",
    };
  });

  // Phase 2 — fetch metadata (license, downloads, gated, open-weights) for every
  // model that now has a known HF id (whether from OpenRouter or our search).
  const repoOfficialOrgs = new Map<string, Set<string>>();
  for (const model of modelsWithInferred) {
    if (!model.huggingface_id) continue;
    const creatorSlug = model.model_creator.slug.toLowerCase();
    const orgs = officialOrgsForCreator(creatorSlug);
    const existing = repoOfficialOrgs.get(model.huggingface_id);
    if (existing) {
      orgs.forEach((org) => existing.add(org));
    } else {
      repoOfficialOrgs.set(model.huggingface_id, orgs);
    }
  }

  const repos = [...repoOfficialOrgs.keys()];
  if (repos.length === 0) return modelsWithInferred;

  const patches = new Map<string, Partial<LLMModel>>();
  const batchSize = 8;
  for (let i = 0; i < repos.length; i += batchSize) {
    const batch = repos.slice(i, i + batchSize);
    const settled = await Promise.allSettled(
      batch.map((repo) =>
        getHuggingFaceModelInfo(repo, repoOfficialOrgs.get(repo) ?? new Set(), options.apiKey),
      ),
    );
    settled.forEach((result, index) => {
      if (result.status === "fulfilled") patches.set(batch[index], result.value);
    });
  }

  return modelsWithInferred.map((model) => {
    const patch = model.huggingface_id ? patches.get(model.huggingface_id) : undefined;
    return patch ? mergeDefinedModel(model, patch) : model;
  });
}
