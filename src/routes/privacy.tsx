import { createFileRoute } from "@tanstack/react-router";
import { TrustPage } from "@/components/trust-page";
import { seo } from "@/lib/seo";
export const Route = createFileRoute("/privacy")({
  head: () => seo({ title: "Privacy | BenchSift", path: "/privacy" }),
  component: () => <TrustPage kind="privacy" />,
});
