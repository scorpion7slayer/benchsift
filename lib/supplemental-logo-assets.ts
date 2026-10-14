// Lobe Icons brand SVGs, pinned source and license in public/licenses/NOTICE.txt.
export const supplementalLogoAssets = new Set(["reve","ideogram","fal","briaai","midjourney","stability","runway","pixverse","skywork","pika","haiper","voyage","aionlabs","relace","baai","morph","sakana","reka"]);

/**
 * Model family marks, keyed by family; `file` is relative to /logos/. Most come
 * from the pinned Lobe Icons commit; see public/licenses/NOTICE.txt for the rest.
 */
export const modelFamilyLogoAssets: Readonly<Record<string, { file: string; monochrome: boolean }>> = {
  // Lobe Icons still ships Qwen's former mark; this is the current one from Qwen Chat.
  qwen: { file: "qwen/qwen.svg", monochrome: false },
  gemini: { file: "lobe/gemini-color.svg", monochrome: false },
  gemma: { file: "lobe/gemma-color.svg", monochrome: false },
  palm: { file: "lobe/palm-color.svg", monochrome: false },
  claude: { file: "lobe/claude-color.svg", monochrome: false },
  grok: { file: "lobe/grok.svg", monochrome: true },
  hunyuan: { file: "lobe/hunyuan-color.svg", monochrome: false },
  ernie: { file: "lobe/wenxin-color.svg", monochrome: false },
  nova: { file: "lobe/nova-color.svg", monochrome: false },
  mimo: { file: "lobe/xiaomimimo.svg", monochrome: true },
  hailuo: { file: "lobe/hailuo-color.svg", monochrome: false },
  sora: { file: "lobe/sora-color.svg", monochrome: false },
};
