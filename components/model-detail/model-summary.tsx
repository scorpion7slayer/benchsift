import { Fragment, type ReactNode } from "react";
import { Link } from "@/components/link";
import { formatMoney, formatNumber, formatSpeed, localeFor } from "@/lib/format";
import { useI18n, type Lang } from "@/lib/i18n";
import type { ModelInsights } from "@/lib/model-insights";
import { textMetricValue } from "@/lib/model-metrics";
import { modelSummary, type PeerComparison, type Relation } from "@/lib/model-summary";
import type { LLMModel } from "@/lib/model-types";

function finite(value: number | null | undefined): number | null {
  return value != null && Number.isFinite(value) ? value : null;
}

/** "A, B and C" in the reader's language, keeping each item a React node. */
function joinList(items: ReactNode[], lang: Lang): ReactNode {
  const parts = new Intl.ListFormat(localeFor(lang), { type: "conjunction" }).formatToParts(items.map((_, index) => String(index)));
  return parts.map((part, index) => (
    <Fragment key={index}>{part.type === "element" ? items[Number(part.value)] : part.value}</Fragment>
  ));
}

/**
 * A paragraph that places the model among its closest peers on the
 * Intelligence Index: its score and rank, then its blended price and output
 * speed against theirs. Every value is a measurement shown elsewhere on the page.
 */
export function ModelSummary({ model, insights }: { model: LLMModel; insights: Pick<ModelInsights, "ranks" | "similar"> }) {
  const { t, lang } = useI18n();
  const copy = t.detail.summary;
  const summary = modelSummary(
    {
      intelligence: textMetricValue(model, "artificial_analysis_intelligence_index"),
      price: finite(model.pricing.price_1m_blended_3_to_1),
      speed: finite(model.median_output_tokens_per_second),
    },
    insights.ranks.artificial_analysis_intelligence_index,
    insights.similar,
  );
  if (!summary) return null;

  const clauses = (
    key: "price" | "speed",
    order: Relation[],
    clause: Record<Relation, (list: ReactNode) => ReactNode>,
    value: (peer: PeerComparison["peer"]) => string,
  ): ReactNode | null => {
    const groups = order.flatMap((relation) => {
      const peers = summary.peers.filter((entry) => entry[key] === relation);
      return peers.length
        ? [clause[relation](joinList(peers.map(({ peer }) => `${peer.name} (${value(peer)})`), lang))]
        : [];
    });
    return groups.length ? groups.map((group, index) => <Fragment key={index}>{index > 0 && ", "}{group}</Fragment>) : null;
  };

  const price = summary.price === null
    ? null
    : clauses("price", ["lower", "similar", "higher"], copy.priceClause, (peer) => formatMoney(peer.price, lang));
  const speed = summary.speed === null
    ? null
    : clauses("speed", ["higher", "similar", "lower"], copy.speedClause, (peer) => formatSpeed(peer.speed, lang));
  const peerLinks = summary.peers.map(({ peer }) => (
    <Fragment key={peer.slug}>
      <Link href={`/models/${peer.slug}`} className="rounded-sm font-medium text-foreground underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {peer.name}
      </Link>
      {` (${formatNumber(peer.intelligence, lang)})`}
    </Fragment>
  ));

  return (
    <p className="max-w-4xl text-sm leading-6 text-muted-foreground text-pretty">
      {copy.score(model.name, formatNumber(summary.intelligence, lang), summary.rank)}{" "}
      {copy.peers(joinList(peerLinks, lang), summary.peers.length)}
      {price && <>{" "}{copy.price(formatMoney(summary.price, lang), price)}</>}
      {speed && <>{" "}{copy.speed(formatSpeed(summary.speed, lang), speed)}</>}
    </p>
  );
}
