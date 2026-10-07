import { ModelProviderIcon } from "@/components/model-provider-icon";
import { harnessProvider } from "@/lib/coding-agents";

/** Logo of a coding-agent harness, from its provider. */
export function HarnessIcon({
  slug,
  size = 20,
  creator,
}: {
  slug: string;
  size?: number;
  creator?: string | null;
}) {
  return <ModelProviderIcon provider={harnessProvider(slug, creator)} size={size} />;
}
