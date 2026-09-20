import { createFileRoute } from "@tanstack/react-router";
import { TrustPage } from "@/components/trust-page";
import { seo } from "@/lib/seo";
export const Route = createFileRoute("/legal")({
  head: () => seo({ title: "Legal | BenchSift", path: "/legal" }),
  component: () => <TrustPage kind="legal" />,
});
