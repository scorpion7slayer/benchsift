// Server functions — the TanStack Start equivalent of the data-fetching that
// used to happen inside Next.js Server Components. Each wraps a `lib/api`
// call so it runs only on the server (route loaders call these).
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, setResponseHeader } from "@tanstack/react-start/server";
import {
  getLLMModels,
  getLLMModel,
  getLLMModelSupplementary,
  getCodingAgents,
  type LLMModel,
} from "@/lib/api";
import {
  getModelReasoningFamily,
  toModelDetailData,
  type ModelDetailData,
} from "@/lib/model-reasoning";
import { getDeepSweData, type DeepSweData } from "@/lib/deepswe";
import type { CompareModelOption } from "@/lib/compare-model";
import type { Lang } from "@/lib/i18n";
import {
  buildHomeCatalogData,
  type HomeCatalogData,
} from "@/lib/home-catalog";
import { readCookieValue } from "@/lib/http-cookie";

function setPublicResponseCache(): void {
  try {
    setResponseHeader(
      "cache-control",
      "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
    );
  } catch {
    // The header helper only exists during request handling.
  }
}

/** Validates a model slug the same way the AA scraper does. */
function isSafeSlug(slug: string): boolean {
  return /^[a-z0-9][a-z0-9._-]{1,119}$/i.test(slug);
}

/** Full models list (fast KV-cached path). */
export const fetchModels = createServerFn({ method: "GET" }).handler(
  async (): Promise<LLMModel[]> => {
    setPublicResponseCache();
    return getLLMModels();
  },
);

/** Lightweight data needed by the default homepage ranking. */
export const fetchHomeCatalog = createServerFn({ method: "GET" }).handler(
  async (): Promise<HomeCatalogData> => {
    setPublicResponseCache();
    return buildHomeCatalogData(await getLLMModels());
  },
);

/** A model and its matching reasoning variants (no scraped capabilities). */
export const fetchModelDetail = createServerFn({ method: "GET" })
  .inputValidator((slug: string) => slug)
  .handler(async ({ data }): Promise<ModelDetailData | null> => {
    if (!isSafeSlug(data)) return null;
    const family = getModelReasoningFamily(await getLLMModels(), data);
    return family ? toModelDetailData(family, data) : null;
  });

/** Scraped capabilities for a model (context window, modalities, params…). */
export const fetchModelCapabilities = createServerFn({ method: "GET" })
  .inputValidator((slug: string) => slug)
  .handler(async ({ data }): Promise<Partial<LLMModel>> => {
    if (!isSafeSlug(data)) return {};
    return getLLMModelSupplementary(data);
  });

/** Lightweight search options + the selected, enriched comparison models. */
export const fetchCompareData = createServerFn({ method: "GET" })
  .inputValidator((slugs: string[]) => slugs)
  .handler(
    async ({ data }): Promise<{ allModels: CompareModelOption[]; selected: LLMModel[] }> => {
      setPublicResponseCache();
      const slugs = [...new Set(data.filter(isSafeSlug))].slice(0, 4);
      const [models, ...selectedModels] = await Promise.all([
        getLLMModels(),
        ...slugs.map((slug) => getLLMModel(slug)),
      ]);
      const allModels = models.map((model) => ({
        id: model.id,
        name: model.name,
        slug: model.slug,
        model_creator: {
          name: model.model_creator.name,
          slug: model.model_creator.slug,
        },
        provider_icon_url: model.provider_icon_url,
        intelligence_score:
          model.evaluations.artificial_analysis_intelligence_index ?? null,
      }));
      const selected = selectedModels.filter(
        (m): m is NonNullable<typeof m> => m != null,
      );
      return { allModels, selected };
    },
  );

/** AA coding-agents leaderboard. */
export const fetchCodingAgents = createServerFn({ method: "GET" }).handler(
  async () => getCodingAgents(),
);

/** Datacurve DeepSWE leaderboard. */
export const fetchDeepSweData = createServerFn({ method: "GET" }).handler(
  async (): Promise<DeepSweData> => {
    setPublicResponseCache();
    return getDeepSweData();
  },
);

export interface Preferences {
  lang: Lang;
  theme: string;
  noticeAcknowledged: boolean;
}

/** Reads the language/theme preferences from the request cookies. */
export const fetchPreferences = createServerFn({ method: "GET" }).handler(
  async (): Promise<Preferences> => {
    const cookie = getRequestHeader("cookie") ?? "";
    const read = (name: string): string | undefined =>
      readCookieValue(cookie, name);

    const lang: Lang = read("benchsift_lang") === "fr" ? "fr" : "en";
    const storedTheme = read("benchsift_theme");
    const theme = ["dark", "light", "system"].includes(storedTheme ?? "")
      ? storedTheme!
      : "system";
    const noticeAcknowledged =
      /(?:^|;\s*)benchsift_(?:notice=1|consent=(?:0|1))(?:;|$)/.test(cookie);

    return { lang, theme, noticeAcknowledged };
  },
);
