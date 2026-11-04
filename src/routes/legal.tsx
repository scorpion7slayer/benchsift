import { createFileRoute } from "@tanstack/react-router";
import { TrustPage } from "@/components/trust-page";
import { pageHead } from "@/lib/route-seo";
export const Route = createFileRoute("/legal")({
  head: ({ match }) => pageHead(match.context.lang, "legal", "/legal"),
  component: () => <TrustPage kind="legal" />,
});
