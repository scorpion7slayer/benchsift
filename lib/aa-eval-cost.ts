/*
 * Per-task figures Artificial Analysis computes in the browser for its agentic
 * evaluation pages, from a model's published token counts
 * (`canonicalEvalTokenCounts[<evaluation>]`, totals over the whole task set),
 * prices, cache hit rate and output speed.
 */

type Props = Record<string, unknown>;

function isProps(value: unknown): value is Props {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function count(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

export interface AaEvalPerTask {
  /** Answer plus reasoning tokens per task. */
  output_tokens: number | null;
  cost_usd: number | null;
  /** Decode time per task: output tokens over output speed, without TTFT or overhead. */
  time_seconds: number | null;
}

/**
 * Per-task figures as AA computes them. Output tokens need both published
 * halves. Cost needs prices and a cache hit rate: cache hits are billed at the
 * cache-hit price, every other input token at the cache-write price (the input
 * price when there is none), output at the output price. AA shows no cost for
 * a model without a hit rate or priced at zero, so neither does this.
 */
export function aaEvalPerTask(model: Props, evaluation: string, tasks: number): AaEvalPerTask {
  const counts = isProps(model.canonicalEvalTokenCounts) ? model.canonicalEvalTokenCounts[evaluation] : null;
  const tokens = isProps(counts) ? counts : {};
  const answer = count(tokens.answer);
  const reasoning = count(tokens.reasoning);
  const output = answer === null || reasoning === null ? null : answer + reasoning;
  if (output === null) return { output_tokens: null, cost_usd: null, time_seconds: null };

  const speed = count(model.medianCanonicalAnswerOutputSpeed);
  const input = count(tokens.input);
  const cacheable = tokens.cacheableInput == null ? 0 : count(tokens.cacheableInput);
  const inputPrice = count(model.price1mInputTokens);
  const outputPrice = count(model.price1mOutputTokens);
  const hitPrice = count(model.cacheHitPrice);
  const writePrice = model.cacheWritePrice == null ? inputPrice : count(model.cacheWritePrice);
  const hitRate = count(model.cacheHitRate);
  const hits = cacheable !== null && hitRate !== null && hitRate <= 1 ? cacheable * hitRate : null;
  const priced = inputPrice !== null && outputPrice !== null && inputPrice + outputPrice > 0;
  const cost =
    priced && input !== null && hits !== null && hits <= input && writePrice !== null && (hits === 0 || hitPrice !== null)
      ? ((input - hits) * writePrice + hits * (hitPrice ?? 0) + output * outputPrice) / 1e6
      : null;
  return {
    output_tokens: output / tasks,
    cost_usd: cost === null ? null : cost / tasks,
    time_seconds: speed ? output / tasks / speed : null,
  };
}
