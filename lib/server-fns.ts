// Server functions — the TanStack Start equivalent of the data-fetching that
// used to happen inside Next.js Server Components. Each wraps a `lib/api`
// call so it runs only on the server (route loaders call these).
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, setResponseHeader } from "@tanstack/react-start/server";
import {
  getLLMModels,
  getLLMModelBasic,
  getLLMModel,
  getLLMModelSupplementary,
  getCodingAgents,
  type LLMModel,
} from "@/lib/api";
import type { Lang } from "@/lib/i18n";

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

/** A single model's base data (no scraped capabilities). */
export const fetchModelBasic = createServerFn({ method: "GET" })
  .inputValidator((slug: string) => slug)
  .handler(async ({ data }): Promise<LLMModel | null> => {
    if (!isSafeSlug(data)) return null;
    return (await getLLMModelBasic(data)) ?? null;
  });

/** Scraped capabilities for a model (context window, modalities, params…). */
export const fetchModelCapabilities = createServerFn({ method: "GET" })
  .inputValidator((slug: string) => slug)
  .handler(async ({ data }): Promise<Partial<LLMModel>> => {
    if (!isSafeSlug(data)) return {};
    return getLLMModelSupplementary(data);
  });

/** Data for the compare page: every model + the selected (enriched) ones. */
export const fetchCompareData = createServerFn({ method: "GET" })
  .inputValidator((slugs: string[]) => slugs)
  .handler(
    async ({ data }): Promise<{ allModels: LLMModel[]; selected: LLMModel[] }> => {
      setPublicResponseCache();
      const slugs = data.filter(isSafeSlug).slice(0, 4);
      const [allModels, ...selectedModels] = await Promise.all([
        getLLMModels(),
        ...slugs.map((slug) => getLLMModel(slug)),
      ]);
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

export interface Preferences {
  lang: Lang;
  theme: string;
}

/** Reads the language/theme preferences from the request cookies. */
export const fetchPreferences = createServerFn({ method: "GET" }).handler(
  async (): Promise<Preferences> => {
    const cookie = getRequestHeader("cookie") ?? "";
    const read = (name: string): string | undefined =>
      cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))?.[1];

    const lang: Lang = read("benchsift_lang") === "fr" ? "fr" : "en";
    const storedTheme = read("benchsift_theme");
    const theme = ["dark", "light", "system"].includes(storedTheme ?? "")
      ? storedTheme!
      : "system";

    return { lang, theme };
  },
);
