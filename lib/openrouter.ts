import type { LLMModel } from "@/lib/api";
import { createEmptyEvaluations } from "@/lib/model-metrics";

const OR_BASE = "https://openrouter.ai/api/v1";
const OPENROUTER_RANKINGS_PAGE = "https://openrouter.ai/rankings";
const OPENROUTER_APP_REFERER = "https://benchsift.nxtaigen.com";
const OPENROUTER_APP_TITLE = "BenchSift";

const MODEL_RANKINGS_ACTION_ID = "40824635c5eb77626bdf6795ffbf382c0862b321e1";
const DA_BENCHMARK_RANKINGS_ACTION_ID = "00f63ea3aac04d141ad7cda1cbafdc6bb12dc75b45";

const OPENROUTER_ACTION_TIMEOUT_MS = 8_000;
const OPENROUTER_API_TIMEOUT_MS = 8_000;
const OPENROUTER_PAGE_TIMEOUT_MS = 5_000;
const OPENROUTER_MODEL_OUTPUT_CATEGORIES = [
  "text",
  "image",
  "embeddings",
  "audio",
  "video",
  "rerank",
  "speech",
  "transcription",
];
const OPENROUTER_DISPLAY_PRICING_CATEGORIES = new Set([
  "image",
  "audio",
  "video",
  "rerank",
  "speech",
  "transcription",
]);
const TOKEN_DISPLAY_MODALITIES = new Set(["text", "audio"]);

interface OpenRouterDisplayPricingRow {
  kind?: string;
  sku_label?: string;
  price?: string;
  displayMultiplier?: number;
  unitLabel?: string;
}

export interface OpenRouterModel {
  id: string;
  canonical_slug: string;
  hugging_face_id: string | null;
  name: string;
  created: number;
  context_length: number;
  architecture: {
    modality: string;
    input_modalities: string[];
    output_modalities: string[];
    tokenizer: string;
    instruct_type: string | null;
  };
  pricing: {
    prompt: string;
    completion: string;
    image?: string;
    audio?: string;
    input_cache_read?: string;
  };
  top_provider: {
    context_length: number | null;
    max_completion_tokens: number | null;
    is_moderated: boolean;
  } | null;
  supported_parameters: string[] | null;
  supported_voices?: string[] | null;
  display_pricing?: OpenRouterDisplayPricingRow[];
}

interface OpenRouterRankingRow {
  model_permaslug?: string;
  variant?: string;
  variant_permaslug?: string;
  total_completion_tokens?: number;
  total_prompt_tokens?: number;
  total_native_tokens_reasoning?: number;
  total_native_tokens_cached?: number;
  total_tool_calls?: number;
  num_media_prompt?: number;
  num_media_completion?: number;
  num_audio_prompt?: number;
  count?: number;
  change?: number | null;
}

interface OpenRouterDABenchmarkRow {
  permaslug?: string;
  openrouter_id?: string | null;
  display_name?: string;
  score?: number | null;
  win_rate?: number | null;
  avg_generation_time_ms?: number | null;
}

interface OpenRouterEnrichmentOptions {
  apiKey?: string;
  includeUsageRankings?: boolean;
  includeBenchmarks?: boolean;
  includeOpenRouterOnly?: boolean;
}

function fetchWithTimeout(
  input: string | URL | Request,
  init: RequestInit = {},
  timeoutMs = OPENROUTER_API_TIMEOUT_MS,
): Promise<Response> {
  return fetch(input, {
    ...init,
    signal: init.signal ?? AbortSignal.timeout(timeoutMs),
  });
}

function openRouterHeaders(apiKey?: string): HeadersInit {
  return {
    ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    "HTTP-Referer": OPENROUTER_APP_REFERER,
    "X-OpenRouter-Title": OPENROUTER_APP_TITLE,
  };
}

export async function getOpenRouterModels(
  options: { apiKey?: string } = {},
): Promise<OpenRouterModel[]> {
  try {
    const headers = openRouterHeaders(options.apiKey);
    const responses = await Promise.allSettled(
      OPENROUTER_MODEL_OUTPUT_CATEGORIES.map(async (category) => {
        const res = await fetchWithTimeout(
          `${OR_BASE}/models?output_modalities=${encodeURIComponent(category)}`,
          { headers },
        );
        if (!res.ok) return [];
        const json = (await res.json()) as { data?: OpenRouterModel[] };
        return json.data ?? [];
      }),
    );
    const byId = new Map<string, OpenRouterModel>();
    for (const response of responses) {
      if (response.status !== "fulfilled") continue;
      for (const model of response.value) {
        byId.set(model.id, model);
      }
    }
    const models = [...byId.values()];
    await enrichOpenRouterDisplayPricing(models);
    return models;
  } catch {
    return [];
  }
}

function needsDisplayPricing(model: OpenRouterModel): boolean {
  const modalities = [
    ...(model.architecture?.input_modalities ?? []),
    ...(model.architecture?.output_modalities ?? []),
  ];
  return modalities.some((modality) => OPENROUTER_DISPLAY_PRICING_CATEGORIES.has(modality));
}

async function enrichOpenRouterDisplayPricing(models: OpenRouterModel[]): Promise<void> {
  const candidates = models.filter(needsDisplayPricing);
  const batchSize = 8;

  for (let i = 0; i < candidates.length; i += batchSize) {
    const batch = candidates.slice(i, i + batchSize);
    const rows = await Promise.allSettled(
      batch.map((model) => getOpenRouterDisplayPricing(model.id)),
    );

    rows.forEach((result, index) => {
      if (result.status === "fulfilled" && result.value.length > 0) {
        batch[index].display_pricing = result.value;
      }
    });
  }
}

async function getOpenRouterDisplayPricing(modelId: string): Promise<OpenRouterDisplayPricingRow[]> {
  try {
    const res = await fetchWithTimeout(
      `https://openrouter.ai/${modelId}`,
      {},
      OPENROUTER_PAGE_TIMEOUT_MS,
    );
    if (!res.ok) return [];
    return extractOpenRouterDisplayPricing(await res.text());
  } catch {
    return [];
  }
}

function extractOpenRouterDisplayPricing(html: string): OpenRouterDisplayPricingRow[] {
  const marker = 'displayPricing":';
  const escapedMarker = 'displayPricing\\":';
  let markerIndex = html.indexOf(marker);
  let isEscapedJson = false;
  if (markerIndex < 0) {
    markerIndex = html.indexOf(escapedMarker);
    isEscapedJson = markerIndex >= 0;
  }
  if (markerIndex < 0) return [];

  const start = html.indexOf("[", markerIndex + (isEscapedJson ? escapedMarker.length : marker.length));
  if (start < 0) return [];

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < html.length; i++) {
    const char = html[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === "\\") {
      escaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (char === "[") depth++;
    if (char === "]") {
      depth--;
      if (depth === 0) {
        const raw = html.slice(start, i + 1);
        try {
          const json = isEscapedJson ? raw.replace(/\\"/g, '"') : raw;
          const parsed = JSON.parse(json) as OpenRouterDisplayPricingRow[];
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      }
    }
  }

  return [];
}

/** Finds the OR model matching an AA slug via multiple strategies. */
export function findOpenRouterModel(
  aaSlug: string,
  orModels: OpenRouterModel[],
): OpenRouterModel | undefined {
  return orModels.find((or) => openRouterModelMatchesSlug(aaSlug, or));
}

/** Converts an OR model to our capabilities format. */
export function openRouterCapabilities(or: OpenRouterModel): Partial<LLMModel> {
  const inp = or.architecture?.input_modalities ?? [];
  const out = or.architecture?.output_modalities ?? [];
  const params = or.supported_parameters ?? [];
  const has = (arr: string[], ...keys: string[]) =>
    keys.some((k) => arr.includes(k)) ? true : undefined;
  return {
    context_window_tokens: or.context_length || or.top_provider?.context_length || null,
    reasoning_model: params.includes("reasoning") || params.includes("include_reasoning")
      ? true
      : undefined,
    input_modality_text: has(inp, "text"),
    input_modality_image: has(inp, "image"),
    input_modality_speech: has(inp, "audio", "speech"),
    input_modality_video: has(inp, "video"),
    output_modality_text: has(out, "text"),
    output_modality_image: has(out, "image"),
    output_modality_speech: has(out, "audio", "speech", "transcription"),
    output_modality_video: has(out, "video"),
    openrouter_input_modalities: inp,
    openrouter_output_modalities: out,
    openrouter_supported_voices: or.supported_voices ?? undefined,
    huggingface_id: or.hugging_face_id ?? undefined,
    huggingface_url: or.hugging_face_id ? `https://huggingface.co/${or.hugging_face_id}` : undefined,
    huggingface_source: or.hugging_face_id ? "openrouter" : undefined,
  };
}

async function callOpenRouterRankingsAction<T>(
  actionId: string,
  body: string,
): Promise<T | null> {
  try {
    const res = await fetchWithTimeout(
      OPENROUTER_RANKINGS_PAGE,
      {
        method: "POST",
        headers: {
          "Accept": "text/x-component",
          "Content-Type": "text/plain;charset=UTF-8",
          "Next-Action": actionId,
        },
        body,
      },
      OPENROUTER_ACTION_TIMEOUT_MS,
    );
    if (!res.ok) return null;
    const text = await res.text();
    const payload = text.match(/^1:(.*)$/m)?.[1];
    if (!payload) return null;
    return JSON.parse(payload) as T;
  } catch {
    return null;
  }
}

async function getOpenRouterUsageRankings(): Promise<OpenRouterRankingRow[]> {
  return (
    (await callOpenRouterRankingsAction<OpenRouterRankingRow[]>(
      MODEL_RANKINGS_ACTION_ID,
      JSON.stringify(["week"]),
    )) ?? []
  );
}

async function getOpenRouterDABenchmarkRankings(): Promise<Record<string, OpenRouterDABenchmarkRow[]>> {
  return (
    (await callOpenRouterRankingsAction<Record<string, OpenRouterDABenchmarkRow[]>>(
      DA_BENCHMARK_RANKINGS_ACTION_ID,
      "[]",
    )) ?? {}
  );
}

function normaliseId(id: string | null | undefined): string | null {
  if (!id) return null;
  return id
    .toLowerCase()
    .replace(/:free$/, "")
    .replace(/[\s_]/g, "-");
}

function stripDateSuffix(id: string): string {
  return id.replace(/-\d{8}$/, "");
}

function idCandidates(id: string | null | undefined): string[] {
  const norm = normaliseId(id);
  if (!norm) return [];
  const suffix = norm.split("/").pop() ?? norm;
  const dashed = norm.replace(/\./g, "-");
  const dashedSuffix = dashed.split("/").pop() ?? dashed;
  return [...new Set([
    norm,
    suffix,
    stripDateSuffix(norm),
    stripDateSuffix(suffix),
    dashed,
    dashedSuffix,
    stripDateSuffix(dashed),
    stripDateSuffix(dashedSuffix),
  ])];
}

function openRouterModelPart(or: OpenRouterModel): string {
  const fromId = or.id.split("/").pop();
  const fromCanonical = or.canonical_slug?.split("/").pop();
  return stripDateSuffix(normaliseId(fromId) ?? normaliseId(fromCanonical) ?? or.id);
}

function isMovingAliasPart(modelPart: string): boolean {
  return modelPart === "latest" || modelPart.endsWith("-latest");
}

export function isOpenRouterOnlyMovingAliasModel(
  model: Pick<LLMModel, "id" | "slug">,
): boolean {
  if (!model.id.startsWith("openrouter:")) return false;
  const idPart = stripDateSuffix(
    normaliseId(model.id.replace(/^openrouter:/, "").split("/").pop()) ?? "",
  );
  const slugPart = stripDateSuffix(normaliseId(model.slug) ?? "");
  return isMovingAliasPart(idPart) || isMovingAliasPart(slugPart);
}

function isOpenRouterMovingAlias(or: OpenRouterModel): boolean {
  return isMovingAliasPart(openRouterModelPart(or));
}

function providerSlug(or: OpenRouterModel): string {
  const slug = (normaliseId(or.id.split("/")[0]) ?? "openrouter").replace(/[^a-z0-9-]+/g, "-");
  const aliases: Record<string, string> = {
    "mistralai": "mistral",
    "x-ai": "xai",
    "z-ai": "zai",
  };
  return aliases[slug] ?? slug;
}

function openRouterModelMatchesSlug(slug: string, or: OpenRouterModel): boolean {
  const normSlug = normaliseId(slug);
  if (!normSlug) return false;

  const modelPart = openRouterModelPart(or);
  const fullCandidates = new Set([
    ...idCandidates(or.id),
    ...idCandidates(or.canonical_slug),
  ]);
  if (fullCandidates.has(normSlug)) return true;

  const slugPart = normSlug.split("/").pop() ?? normSlug;
  if (modelPart === slugPart) return true;

  // Some AA pages use the family slug while OpenRouter names the same release
  // with a lightweight lifecycle suffix, e.g. AA `hy3` vs OR `hy3-preview`.
  const dashedModelPart = modelPart.replace(/\./g, "-");
  const dashedSlugPart = slugPart.replace(/\./g, "-");
  if (dashedModelPart === dashedSlugPart) return true;

  const toleratedSuffixes = ["preview", "beta", "alpha", "experimental", "exp"];
  for (const suffix of toleratedSuffixes) {
    if (
      modelPart === `${slugPart}-${suffix}` ||
      dashedModelPart === `${dashedSlugPart}-${suffix}`
    ) {
      return true;
    }
  }

  return false;
}

function modelCandidates(model: LLMModel, orModel?: OpenRouterModel): Set<string> {
  return new Set([
    ...idCandidates(model.slug),
    ...idCandidates(`${model.model_creator.slug}/${model.slug}`),
    ...idCandidates(orModel?.id),
    ...idCandidates(orModel?.canonical_slug),
  ]);
}

function rowCandidates(row: OpenRouterDABenchmarkRow | OpenRouterRankingRow): Set<string> {
  return new Set([
    ...idCandidates("permaslug" in row ? row.permaslug : undefined),
    ...idCandidates("openrouter_id" in row ? row.openrouter_id : undefined),
    ...idCandidates("model_permaslug" in row ? row.model_permaslug : undefined),
    ...idCandidates("variant_permaslug" in row ? row.variant_permaslug : undefined),
  ]);
}

function matchesModel(
  modelIds: Set<string>,
  row: OpenRouterDABenchmarkRow | OpenRouterRankingRow,
): boolean {
  for (const candidate of rowCandidates(row)) {
    if (modelIds.has(candidate)) return true;
  }
  return false;
}

function metricKey(category: string): string {
  return category.replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "").toLowerCase();
}

function mergeOpenRouterData(
  model: LLMModel,
  modelIds: Set<string>,
  usageRows: OpenRouterRankingRow[],
  daBenchmarks: Record<string, OpenRouterDABenchmarkRow[]>,
): LLMModel {
  const evaluations = { ...model.evaluations };

  for (const [category, rows] of Object.entries(daBenchmarks)) {
    if (!category.startsWith("models-")) continue;
    const row = rows.find((r) => typeof r.win_rate === "number" && matchesModel(modelIds, r));
    if (row?.win_rate != null) {
      const key = metricKey(category.replace(/^models-/, ""));
      evaluations[`openrouter_da_${key}_win_rate`] = row.win_rate;
      if (typeof row.score === "number") evaluations[`openrouter_da_${key}_score`] = row.score;
      if (typeof row.avg_generation_time_ms === "number") {
        evaluations[`openrouter_da_${key}_generation_seconds`] = row.avg_generation_time_ms / 1000;
      }
    }
  }

  const usageRankings = usageRows.map((row, index) => ({
    row,
    rank: index + 1,
    tokens:
      (row.total_prompt_tokens ?? 0) +
      (row.total_completion_tokens ?? 0) +
      (row.total_native_tokens_reasoning ?? 0),
  }));
  const usage = usageRankings.find(({ row }) => matchesModel(modelIds, row));
  if (!usage) return { ...model, evaluations };

  return {
    ...model,
    evaluations,
    openrouter_weekly_rank: usage.rank,
    openrouter_weekly_tokens: usage.tokens,
    openrouter_weekly_requests: usage.row.count ?? null,
    openrouter_weekly_tool_calls: usage.row.total_tool_calls ?? null,
    openrouter_weekly_images:
      (usage.row.num_media_prompt ?? 0) + (usage.row.num_media_completion ?? 0),
    openrouter_weekly_audio_inputs: usage.row.num_audio_prompt ?? null,
    openrouter_variant: usage.row.variant ?? null,
  };
}

function mergeDefined<T extends object>(base: T, patch: Partial<T>): T {
  const next = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    if (value !== undefined && value !== null) {
      (next as Record<string, unknown>)[key] = value;
    }
  }
  return next;
}

function pricePerMillion(price: string | undefined): number | null {
  if (!price) return null;
  const value = Number(price);
  return Number.isFinite(value) ? value * 1_000_000 : null;
}

function rawPrice(price: string | undefined): number | null {
  if (!price) return null;
  const value = Number(price);
  return Number.isFinite(value) ? value : null;
}

function openRouterDisplayPrices(or: OpenRouterModel): LLMModel["pricing"]["openrouter_display_prices"] {
  const rows = or.display_pricing ?? [];
  const prices = rows
    .map((row) => {
      if (!row) return null;
      const rawPrice = Number(row.price);
      const multiplier = row.displayMultiplier ?? 1;
      if (!Number.isFinite(rawPrice) || !Number.isFinite(multiplier)) return null;
      return {
        label: row.sku_label || "Price",
        price: rawPrice * multiplier,
        unit: row.unitLabel || "",
        kind: row.kind,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  if (prices.length > 0) return prices;

  const output = or.architecture?.output_modalities ?? [];
  const prompt = rawPrice(or.pricing?.prompt);
  const completion = rawPrice(or.pricing?.completion);
  const image = rawPrice(or.pricing?.image);
  const audio = rawPrice(or.pricing?.audio);

  if (image != null && image > 0) {
    return [{
      label: "Image",
      price: image,
      unit: "per image",
      kind: "unit",
    }];
  }

  if (output.includes("speech") && prompt != null && completion === 0) {
    return [{
      label: "Characters",
      price: prompt * 1_000_000,
      unit: "per 1M characters",
      kind: "unit",
    }];
  }

  if (output.includes("speech")) {
    const speechPrices: NonNullable<LLMModel["pricing"]["openrouter_display_prices"]> = [];
    if (prompt != null && prompt > 0) {
      speechPrices.push({
        label: "Characters",
        price: prompt * 1_000_000,
        unit: "per 1M characters",
        kind: "unit",
      });
    }
    if (completion != null && completion > 0) {
      speechPrices.push({
        label: "Audio output",
        price: completion * 1_000_000,
        unit: "per M audio tokens",
        kind: "unit",
      });
    }
    if (speechPrices.length > 0) return speechPrices;
  }

  if (audio != null && audio > 0) {
    const audioPrices: NonNullable<LLMModel["pricing"]["openrouter_display_prices"]> = [];
    if (prompt != null && prompt > 0) {
      audioPrices.push({
        label: "Text input",
        price: prompt * 1_000_000,
        unit: "per M text tokens",
        kind: "token",
      });
    }
    if (completion != null && completion > 0) {
      audioPrices.push({
        label: "Text output",
        price: completion * 1_000_000,
        unit: "per M text tokens",
        kind: "token",
      });
    }
    audioPrices.push({
      label: "Audio",
      price: audio * 1_000_000,
      unit: "per M audio tokens",
      kind: "unit",
    });
    return audioPrices;
  }

  return undefined;
}

function hasUnitDisplayPricing(or: OpenRouterModel): boolean {
  const output = or.architecture?.output_modalities ?? [];
  const prompt = rawPrice(or.pricing?.prompt);
  const completion = rawPrice(or.pricing?.completion);
  const image = rawPrice(or.pricing?.image);
  const audio = rawPrice(or.pricing?.audio);

  if ((or.display_pricing ?? []).some((row) => row?.kind === "unit")) return true;
  if (image != null && image > 0) return true;
  if (
    audio != null &&
    audio > 0 &&
    !output.some((modality) => TOKEN_DISPLAY_MODALITIES.has(modality))
  ) {
    return true;
  }
  if (output.includes("speech") && prompt != null && completion === 0) return true;
  if (output.includes("transcription") && prompt != null && completion === 0) return true;
  if (
    output.some((modality) => ["image", "video", "rerank"].includes(modality)) &&
    prompt === 0 &&
    completion === 0
  ) {
    return true;
  }
  return false;
}

function blendedThreeToOne(input: number | null, output: number | null): number | null {
  if (input == null || output == null) return null;
  return (input * 3 + output) / 4;
}

function openRouterPricing(or: OpenRouterModel): LLMModel["pricing"] {
  const displayPrices = openRouterDisplayPrices(or);
  const unitPriced = hasUnitDisplayPricing(or);
  const input = unitPriced ? null : pricePerMillion(or.pricing?.prompt);
  const output = unitPriced ? null : pricePerMillion(or.pricing?.completion);

  return {
    price_1m_blended_3_to_1: blendedThreeToOne(input, output),
    price_1m_input_tokens: input,
    price_1m_output_tokens: output,
    price_1m_cache_hit_tokens: unitPriced ? null : pricePerMillion(or.pricing?.input_cache_read),
    openrouter_display_prices: displayPrices,
  };
}

function titleFromSlug(slug: string): string {
  const overrides: Record<string, string> = {
    ai21: "AI21",
    anthropic: "Anthropic",
    deepseek: "DeepSeek",
    google: "Google",
    meta: "Meta",
    mistral: "Mistral",
    openai: "OpenAI",
    qwen: "Qwen",
    xai: "xAI",
  };
  return overrides[slug] ?? slug
    .split("-")
    .map((part) => part ? part[0].toUpperCase() + part.slice(1) : part)
    .join(" ");
}

function displayName(or: OpenRouterModel, creatorName: string): string {
  const prefix = `${creatorName}:`;
  if (or.name.toLowerCase().startsWith(prefix.toLowerCase())) {
    return or.name.slice(prefix.length).trim();
  }
  return or.name;
}

function releaseDate(or: OpenRouterModel): string | null {
  if (!or.created) return null;
  const date = new Date(or.created * 1000);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function isSafeSlug(slug: string): boolean {
  return /^[a-z0-9][a-z0-9._-]{1,119}$/.test(slug);
}

function uniqueSlug(baseSlug: string, provider: string, used: Set<string>): string {
  const normalizedBase = baseSlug
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^[^a-z0-9]+/, "")
    .replace(/[^a-z0-9]+$/, "")
    .slice(0, 100);
  const fallbackBase = `${provider}-${normalizedBase || "model"}`.slice(0, 120);
  const safeBase = isSafeSlug(normalizedBase) ? normalizedBase : fallbackBase;
  if (!used.has(safeBase)) return safeBase;

  const prefixed = `${provider}-${safeBase}`.slice(0, 120);
  if (!used.has(prefixed)) return prefixed;

  let i = 2;
  while (used.has(`${prefixed}-${i}`)) i++;
  return `${prefixed}-${i}`;
}

function openRouterOnlyModel(or: OpenRouterModel, usedSlugs: Set<string>): LLMModel {
  const creatorSlug = providerSlug(or);
  const creatorName = titleFromSlug(creatorSlug);
  const slug = uniqueSlug(openRouterModelPart(or), creatorSlug, usedSlugs);

  return {
    id: `openrouter:${or.id}`,
    name: displayName(or, creatorName),
    slug,
    release_date: releaseDate(or),
    model_creator: {
      id: creatorSlug,
      name: creatorName,
      slug: creatorSlug,
    },
    evaluations: createEmptyEvaluations(),
    pricing: openRouterPricing(or),
    median_output_tokens_per_second: null,
    median_time_to_first_token_seconds: null,
    median_time_to_first_answer_token: null,
    ...openRouterCapabilities(or),
  };
}

function addOpenRouterOnlyModels(
  models: LLMModel[],
  orModels: OpenRouterModel[],
  usageRows: OpenRouterRankingRow[],
  daBenchmarks: Record<string, OpenRouterDABenchmarkRow[]>,
): LLMModel[] {
  const usedSlugs = new Set(models.map((model) => model.slug));
  const next = [...models];

  for (const orModel of orModels) {
    if (isOpenRouterMovingAlias(orModel)) {
      continue;
    }
    if (models.some((model) => openRouterModelMatchesSlug(model.slug, orModel))) {
      continue;
    }
    const model = openRouterOnlyModel(orModel, usedSlugs);
    usedSlugs.add(model.slug);
    next.push(
      mergeOpenRouterData(
        model,
        modelCandidates(model, orModel),
        usageRows,
        daBenchmarks,
      ),
    );
  }

  return next;
}

export async function enrichModelsWithOpenRouter(
  models: LLMModel[],
  options: OpenRouterEnrichmentOptions = {},
): Promise<LLMModel[]> {
  const [orModels, usageRows, daBenchmarks] = await Promise.all([
    getOpenRouterModels({ apiKey: options.apiKey }),
    options.includeUsageRankings ? getOpenRouterUsageRankings() : Promise.resolve([]),
    options.includeBenchmarks !== false ? getOpenRouterDABenchmarkRankings() : Promise.resolve({}),
  ]);

  if (
    orModels.length === 0 &&
    usageRows.length === 0 &&
    Object.keys(daBenchmarks).length === 0
  ) {
    return models;
  }

  const enrichedModels = models.map((model) => {
    const orModel = findOpenRouterModel(model.slug, orModels);
    const caps = orModel ? openRouterCapabilities(orModel) : {};
    const enriched = mergeDefined(model, caps);
    return mergeOpenRouterData(
      enriched,
      modelCandidates(model, orModel),
      usageRows,
      daBenchmarks,
    );
  });

  if (options.includeOpenRouterOnly === false || orModels.length === 0) {
    return enrichedModels;
  }

  return addOpenRouterOnlyModels(enrichedModels, orModels, usageRows, daBenchmarks);
}
