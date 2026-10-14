import { ModelProviderIcon } from "@/components/model-provider-icon";
import { getBrandLogo } from "@/lib/brand-logos";
import { getProviderKey } from "@/lib/provider-map";
import { cn } from "@/lib/utils";

/** The creator's own logo, set inline before its name; nothing when no artwork is bundled. */
export function CreatorMark({
  slug,
  size = 14,
  className,
}: {
  slug: string | null | undefined;
  size?: number;
  className?: string;
}) {
  if (!slug || slug === "stealth") return null;
  const provider = getProviderKey(slug);
  if (!getBrandLogo(provider).src) return null;
  return (
    <span className={cn("-mt-0.5 mr-1.5 inline-flex shrink-0 align-middle", className)}>
      <ModelProviderIcon provider={provider} size={size} />
    </span>
  );
}
