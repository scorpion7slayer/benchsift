import "@tanstack/react-start/server-only";
import type { LLMModel } from "@/lib/api";
import { cached } from "@/lib/revalidate-cache";
import { fetchWithRetry } from "@/lib/fetch-with-retry";
import { mergeModelsDev, parseModelsDev } from "@/lib/models-dev";

const fetchCatalog = cached(
  async () => {
    const response = await fetchWithRetry(
      "https://models.dev/models.json",
      {},
      { timeoutMs: 6000 },
    );
    if (!response.ok) throw new Error("Models.dev catalogue unavailable");
    const rows = parseModelsDev(await response.json());
    if (!rows.length) throw new Error("Empty Models.dev catalogue");
    return rows;
  },
  ["models-dev-canonical-v1"],
  // Only called while building a catalogue; the merged result is persisted.
  { revalidate: 0 },
);

export async function enrichModelsWithModelsDev(
  models: LLMModel[],
): Promise<LLMModel[]> {
  try {
    return mergeModelsDev(models, await fetchCatalog());
  } catch {
    return models;
  } // Optional source: keep AA/OpenRouter and historical data.
}
