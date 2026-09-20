import { createFileRoute } from "@tanstack/react-router";
import { TrustPage } from "@/components/trust-page";
import { seo } from "@/lib/seo";
export const Route = createFileRoute("/accessibility")({
  head: () => seo({ title: "Accessibility | BenchSift", path: "/accessibility" }),
  component: () => <TrustPage kind="accessibility" />,
});
