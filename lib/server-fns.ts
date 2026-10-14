// Server functions — the TanStack Start equivalent of the data-fetching that
// used to happen inside Next.js Server Components. Each wraps a `lib/api`
// call so it runs only on the server (route loaders call these).
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, setResponseHeader } from "@tanstack/react-start/server";
import {
  getLLMModels,
  getLLMModelSupplementary,
  getCodingAgents,
  type LLMModel,
} from "@/lib/api";
import {
  getModelReasoningFamily,
  toModelDetailData,
  type ModelDetailData,
} from "@/lib/model-reasoning";
import {
  familyPoints,
  modelInsights,
  type ComparisonFamily,
  type ModelInsights,
} from "@/lib/model-insights";
import { cyberLeaderboard, type CyberLeaderboard } from "@/lib/cyber-index";
import { getDeepSweData, type DeepSweData } from "@/lib/deepswe";
import { matchDeepSweModels, type DeepSweModelInfo } from "@/lib/deepswe-catalog";
import { getFrontierCodeData, type FrontierCodeData } from "@/lib/frontiercode";
import { matchFrontierCodeModels, type FrontierCodeModelInfo } from "@/lib/frontiercode-catalog";
import { getAa3dData, type Aa3dData } from "@/lib/aa3d";
import { getDecisionIndexData, type DecisionIndexData } from "@/lib/decision-index";
import {
  decisionIndexForModel,
  matchDecisionIndexModels,
  type DecisionIndexModelInfo,
  type ModelDecisionIndex,
} from "@/lib/decision-index-catalog";
import type { CompareModelOption } from "@/lib/compare-model";
import type { Lang } from "@/lib/i18n";
import {
  buildHomeCatalogData,
  homeCatalogPreview,
  type HomeCatalogData,
} from "@/lib/home-catalog";
import { readCookieValue } from "@/lib/http-cookie";
import { readAnalyticsConsent, type AnalyticsConsent } from "@/lib/analytics-consent";
import { getModelCatalogPage } from "@/lib/model-catalog";
import { resolveModelSlug } from "./model-identity";

// Loaders also run inside cookie-personalised SSR documents. Never mark those
// documents public; the server snapshot already avoids repeated data work.
function setResponseCache(): void {
  try {
    setResponseHeader(
      "cache-control",
      "private, no-cache",
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
    setResponseCache();
    return getLLMModels();
  },
);

const homeSnapshots = new WeakMap<LLMModel[], { full: HomeCatalogData; preview: HomeCatalogData }>();

/** Project pagination on the server rather than sending the entire catalogue. */
export const fetchCatalogPage = createServerFn({ method: "GET" })
  .inputValidator((page: number) => page)
  .handler(async ({ data }) => {
    setResponseCache();
    return getModelCatalogPage(await getLLMModels(), data);
  });

/**
 * Data of the home ranking. The default view's first render asks for a
 * preview (the top of the ranking); the browser then loads the full list.
 */
export const fetchHomeCatalog = createServerFn({ method: "GET" })
  .inputValidator((input: { preview?: boolean } | undefined) => ({ preview: input?.preview === true }))
  .handler(async ({ data: { preview } }): Promise<HomeCatalogData> => {
    setResponseCache();
    const models = await getLLMModels();
    let data = homeSnapshots.get(models);
    if (!data) {
      const full = buildHomeCatalogData(models);
      data = { full, preview: homeCatalogPreview(full) };
      homeSnapshots.set(models, data);
    }
    return preview ? data.preview : data.full;
  });

/** A model and its matching reasoning variants (no scraped capabilities). */
export const fetchModelDetail = createServerFn({ method: "GET" })
  .inputValidator((slug: string) => slug)
  .handler(async ({ data }): Promise<(ModelDetailData & ModelInsights) | null> => {
    if (!isSafeSlug(data)) return null;
    const models = await getLLMModels();
    const slug = resolveModelSlug(models, data);
    const family = getModelReasoningFamily(models, slug);
    const detail = family ? toModelDetailData(family, slug) : null;
    return family && detail ? { ...detail, ...modelInsights(models, family, detail.model) } : null;
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
    async ({ data }): Promise<{
      allModels: CompareModelOption[];
      selected: LLMModel[];
      families: Record<string, ComparisonFamily>;
    }> => {
      setResponseCache();
      const slugs = [...new Set(data.filter(isSafeSlug))].slice(0, 4);
      const models = await getLLMModels();
      const bySlug = new Map(models.map(model => [model.slug, model]));
      const selectedModels = [...new Set(slugs.map(slug => resolveModelSlug(models, slug)))].map(slug => bySlug.get(slug));
      // Search options for every model: absent fields are omitted, since this
      // list is serialised into the page.
      const allModels = models.map((model): CompareModelOption => {
        const option: CompareModelOption = {
          id: model.id,
          name: model.name,
          slug: model.slug,
          model_creator: { name: model.model_creator.name, slug: model.model_creator.slug },
          intelligence_score: model.evaluations.artificial_analysis_intelligence_index ?? null,
        };
        if (model.provider_icon_url) option.provider_icon_url = model.provider_icon_url;
        if (model.search_aliases?.length) option.search_aliases = model.search_aliases;
        if (model.stealth_history?.length) option.stealth_history = model.stealth_history;
        return option;
      });
      const selected = selectedModels.filter(
        (m): m is NonNullable<typeof m> => m != null,
      );
      // Each compared model brings its reasoning levels, plotted as one curve.
      const families: Record<string, ComparisonFamily> = {};
      for (const model of selected) {
        const family = getModelReasoningFamily(models, model.slug);
        if (family) {
          families[model.slug] = { familyKey: family.familyKey, familyName: family.familyName, points: familyPoints(family) };
        }
      }
      return { allModels, selected, families };
    },
  );

/** AA coding-agents leaderboard. */
export const fetchCodingAgents = createServerFn({ method: "GET" }).handler(
  async () => { setResponseCache(); return getCodingAgents(); },
);

const cyberSnapshots = new WeakMap<LLMModel[], CyberLeaderboard>();

/** Artificial Analysis Cyber Index, as stored in the catalogue by the refresh job. */
export const fetchCyberIndex = createServerFn({ method: "GET" }).handler(
  async (): Promise<CyberLeaderboard> => {
    setResponseCache();
    const models = await getLLMModels();
    let data = cyberSnapshots.get(models);
    if (!data) { data = cyberLeaderboard(models); cyberSnapshots.set(models, data); }
    return data;
  },
);

/** Datacurve DeepSWE leaderboard. */
export const fetchDeepSweData = createServerFn({ method: "GET" }).handler(
  async (): Promise<DeepSweData & { catalog: Record<string, DeepSweModelInfo> }> => {
    setResponseCache();
    const [data, models] = await Promise.all([getDeepSweData(), getLLMModels()]);
    const rows = data.leaderboards.flatMap((leaderboard) => leaderboard.rows);
    return { ...data, catalog: matchDeepSweModels(models, rows) };
  },
);

/** Artificial Analysis FrontierCode leaderboard. */
export const fetchFrontierCodeData = createServerFn({ method: "GET" }).handler(
  async (): Promise<FrontierCodeData & { catalog: Record<string, FrontierCodeModelInfo> }> => {
    setResponseCache();
    const [data, models] = await Promise.all([getFrontierCodeData(), getLLMModels()]);
    return { ...data, catalog: matchFrontierCodeModels(models, data.rows) };
  },
);

/** Artificial Analysis AA-3D leaderboard; rows join the catalogue by AA slug, as FrontierCode's do. */
export const fetchAa3dData = createServerFn({ method: "GET" }).handler(
  async (): Promise<Aa3dData & { catalog: Record<string, FrontierCodeModelInfo> }> => {
    setResponseCache();
    const [data, models] = await Promise.all([getAa3dData(), getLLMModels()]);
    return { ...data, catalog: matchFrontierCodeModels(models, data.rows) };
  },
);

const decisionMatches = new WeakMap<DecisionIndexData, WeakMap<LLMModel[], Record<string, DecisionIndexModelInfo>>>();

/** Catalogue matches of a Decision Index snapshot, computed once per snapshot pair. */
function decisionIndexMatches(data: DecisionIndexData, models: LLMModel[]): Record<string, DecisionIndexModelInfo> {
  let byModels = decisionMatches.get(data);
  if (!byModels) { byModels = new WeakMap(); decisionMatches.set(data, byModels); }
  let matches = byModels.get(models);
  if (!matches) { matches = matchDecisionIndexModels(models, data.rows); byModels.set(models, matches); }
  return matches;
}

/** Artificial Analysis Decision Index leaderboard. */
export const fetchDecisionIndexData = createServerFn({ method: "GET" }).handler(
  async (): Promise<DecisionIndexData & { catalog: Record<string, DecisionIndexModelInfo> }> => {
    setResponseCache();
    const [data, models] = await Promise.all([getDecisionIndexData(), getLLMModels()]);
    return { ...data, catalog: decisionIndexMatches(data, models) };
  },
);

/** Decision Index result of one catalogue model, streamed to its page. */
export const fetchModelDecisionIndex = createServerFn({ method: "GET" })
  .inputValidator((slug: string) => slug)
  .handler(async ({ data: slug }): Promise<ModelDecisionIndex | null> => {
    if (!isSafeSlug(slug)) return null;
    const [data, models] = await Promise.all([getDecisionIndexData(), getLLMModels()]);
    return decisionIndexForModel(data.rows, decisionIndexMatches(data, models), slug);
  });

export interface Preferences {
  lang: Lang;
  theme: string;
  analyticsConsent: AnalyticsConsent;
}

/** Reads the language/theme preferences from the request cookies. */
export const fetchPreferences = createServerFn({ method: "GET" }).handler(
  async (): Promise<Preferences> => {
    setResponseCache();
    const cookie = getRequestHeader("cookie") ?? "";
    const read = (name: string): string | undefined =>
      readCookieValue(cookie, name);

    const lang: Lang = read("benchsift_lang") === "fr" ? "fr" : "en";
    const storedTheme = read("benchsift_theme");
    const theme = ["dark", "light", "system"].includes(storedTheme ?? "")
      ? storedTheme!
      : "system";
    return { lang, theme, analyticsConsent: readAnalyticsConsent(cookie) };
  },
);
