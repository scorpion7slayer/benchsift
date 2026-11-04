import { createFileRoute } from "@tanstack/react-router";
import { TrustPage } from "@/components/trust-page";
import { pageHead } from "@/lib/route-seo";
export const Route = createFileRoute("/accessibility")({
  head: ({ match }) => pageHead(match.context.lang, "accessibility", "/accessibility"),
  component: () => <TrustPage kind="accessibility" />,
});
