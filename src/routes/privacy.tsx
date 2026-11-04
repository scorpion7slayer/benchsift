import { createFileRoute } from "@tanstack/react-router";
import { TrustPage } from "@/components/trust-page";
import { pageHead } from "@/lib/route-seo";
export const Route = createFileRoute("/privacy")({
  head: ({ match }) => pageHead(match.context.lang, "privacy", "/privacy"),
  component: () => <TrustPage kind="privacy" />,
});
