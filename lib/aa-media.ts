import type { LLMModel, ModelCreator, Pricing } from "@/lib/api";
import { createEmptyEvaluations } from "@/lib/model-metrics";

type AAMediaKind =
  | "text_to_image"
  | "image_editing"
  | "text_to_video"
  | "text_to_speech";

type AAFetcher = <T>(endpoint: string) => Promise<T>;

interface AAMediaCreator {
  id?: string;
  name?: string;
  slug?: string;
}

interface AAMediaRow {
  id?: string;
  name?: string;
  slug?: string;
  model_creator?: AAMediaCreator;
  elo?: number;
  rank?: number;
  ci95?: string;
  appearances?: number;
  release_date?: string | null;
}

const MEDIA_ENDPOINTS: Array<{
  endpoint: string;
  kind: AAMediaKind;
}> = [
  {
    endpoint: "/data/media/text-to-image?include_categories=true",
    kind: "text_to_image",
  },
  {
    endpoint: "/data/media/image-editing",
    kind: "image_editing",
  },
  {
    endpoint: "/data/media/text-to-video?include_categories=true",
    kind: "text_to_video",
  },
  {
    endpoint: "/data/media/text-to-speech",
    kind: "text_to_speech",
  },
];

const EMPTY_PRICING: Pricing = {
  price_1m_blended_3_to_1: null,
  price_1m_input_tokens: null,
  price_1m_output_tokens: null,
  price_1m_cache_hit_tokens: null,
  price_1m_blended_7_2_1: null,
};

function metricKey(kind: AAMediaKind, metric: string): string {
  return `artificial_analysis_media_${kind}_${metric}`;
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isUuidLike(value: string | undefined): boolean {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(value));
}

function creatorFromRow(row: AAMediaRow): ModelCreator {
  const name = row.model_creator?.name?.trim() || "Unknown";
  const rawSlug =
    row.model_creator?.slug ||
    (!isUuidLike(row.model_creator?.id) ? row.model_creator?.id : undefined) ||
    slugify(name) ||
    row.slug?.split(/[-_]/)[0] ||
    "unknown";
  const slug = slugify(rawSlug) || "unknown";
  return {
    id: row.model_creator?.id || slug,
    name,
    slug,
  };
}

function normaliseReleaseDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  if (/^\d{4}-\d{2}$/.test(trimmed)) return `${trimmed}-01`;
  if (/^\d{4}$/.test(trimmed)) return `${trimmed}-01-01`;
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return trimmed;
  return parsed.toISOString().slice(0, 10);
}

function mediaCapabilities(kind: AAMediaKind): Partial<LLMModel> {
  if (kind === "text_to_image") {
    return {
      input_modality_text: true,
      output_modality_image: true,
      openrouter_input_modalities: ["text"],
      openrouter_output_modalities: ["image"],
    };
  }
  if (kind === "image_editing") {
    return {
      input_modality_text: true,
      input_modality_image: true,
      output_modality_image: true,
      openrouter_input_modalities: ["text", "image"],
      openrouter_output_modalities: ["image"],
    };
  }
  if (kind === "text_to_video") {
    return {
      input_modality_text: true,
      output_modality_video: true,
      openrouter_input_modalities: ["text"],
      openrouter_output_modalities: ["video"],
    };
  }
  return {
    input_modality_text: true,
    output_modality_speech: true,
    openrouter_input_modalities: ["text"],
    openrouter_output_modalities: ["speech"],
  };
}

function mediaEvaluations(row: AAMediaRow, kind: AAMediaKind) {
  const evaluations = createEmptyEvaluations();
  if (typeof row.elo === "number") {
    evaluations[metricKey(kind, "elo")] = row.elo;
  }
  if (typeof row.rank === "number") {
    evaluations[metricKey(kind, "rank")] = row.rank;
  }
  if (typeof row.appearances === "number") {
    evaluations[metricKey(kind, "appearances")] = row.appearances;
  }
  return evaluations;
}

function mediaModelFromRow(row: AAMediaRow, kind: AAMediaKind): LLMModel | null {
  if (!row.slug || !row.name) return null;
  const creator = creatorFromRow(row);
  return {
    id: row.id || `aa-media:${kind}:${row.slug}`,
    name: row.name,
    slug: row.slug,
    release_date: normaliseReleaseDate(row.release_date),
    model_creator: creator,
    evaluations: mediaEvaluations(row, kind),
    pricing: { ...EMPTY_PRICING },
    median_output_tokens_per_second: null,
    median_time_to_first_token_seconds: null,
    median_time_to_first_answer_token: null,
    ...mediaCapabilities(kind),
  };
}

function mergeModalities(a: string[] | undefined, b: string[] | undefined): string[] | undefined {
  const values = [...(a ?? []), ...(b ?? [])];
  if (values.length === 0) return undefined;
  return [...new Set(values)];
}

function mergeModel(base: LLMModel, patch: LLMModel): LLMModel {
  return {
    ...base,
    release_date: base.release_date ?? patch.release_date,
    model_creator:
      base.model_creator.name === "Unknown" ? patch.model_creator : base.model_creator,
    evaluations: {
      ...base.evaluations,
      ...patch.evaluations,
    },
    input_modality_text: base.input_modality_text ?? patch.input_modality_text,
    input_modality_image: base.input_modality_image ?? patch.input_modality_image,
    input_modality_speech: base.input_modality_speech ?? patch.input_modality_speech,
    input_modality_video: base.input_modality_video ?? patch.input_modality_video,
    output_modality_text: base.output_modality_text ?? patch.output_modality_text,
    output_modality_image: base.output_modality_image ?? patch.output_modality_image,
    output_modality_speech: base.output_modality_speech ?? patch.output_modality_speech,
    output_modality_video: base.output_modality_video ?? patch.output_modality_video,
    openrouter_input_modalities:
      mergeModalities(base.openrouter_input_modalities, patch.openrouter_input_modalities),
    openrouter_output_modalities:
      mergeModalities(base.openrouter_output_modalities, patch.openrouter_output_modalities),
  };
}

export function mergeAAMediaModels(
  models: LLMModel[],
  mediaModels: LLMModel[],
): LLMModel[] {
  if (mediaModels.length === 0) return models;

  const bySlug = new Map<string, LLMModel>();
  for (const model of models) bySlug.set(model.slug, model);

  for (const mediaModel of mediaModels) {
    const existing = bySlug.get(mediaModel.slug);
    bySlug.set(
      mediaModel.slug,
      existing ? mergeModel(existing, mediaModel) : mediaModel,
    );
  }

  return [...bySlug.values()];
}

export async function fetchAAMediaModels(fetcher: AAFetcher): Promise<LLMModel[]> {
  const responses = await Promise.allSettled(
    MEDIA_ENDPOINTS.map(async ({ endpoint, kind }) => {
      const rows = await fetcher<AAMediaRow[]>(endpoint);
      return rows
        .map((row) => mediaModelFromRow(row, kind))
        .filter((model): model is LLMModel => model !== null);
    }),
  );

  const merged: LLMModel[] = [];
  for (const response of responses) {
    if (response.status === "fulfilled") {
      merged.push(...response.value);
    }
  }
  return mergeAAMediaModels([], merged);
}
