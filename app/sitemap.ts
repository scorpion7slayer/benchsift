import type { MetadataRoute } from "next";
import { getLLMModels } from "@/lib/api";

const BASE = "https://nxtaicard.nxtaigen.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const models = await getLLMModels();

  const modelEntries: MetadataRoute.Sitemap = models.map((model) => ({
    url: `${BASE}/models/${model.slug}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [
    {
      url: BASE,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE}/compare`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...modelEntries,
  ];
}
