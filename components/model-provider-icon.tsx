import { useState, type CSSProperties } from "react";
import { getBrandLogo, localSourceLogo } from "@/lib/brand-logos";

export function ModelProviderIcon({
  provider,
  size = 20,
  iconUrl,
}: {
  provider: string;
  size?: number;
  iconUrl?: string | null;
}) {
  const asset = getBrandLogo(provider);
  const src = localSourceLogo(iconUrl) ?? asset.src;
  const [failed, setFailed] = useState<string | null>(null);
  const initials = provider
    .split(/[-_\s]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
  return (
    <span
      aria-hidden="true"
      className="brand-logo relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-md font-semibold text-muted-foreground"
      data-monochrome={asset.monochrome || undefined}
      style={
        {
          width: size,
          height: size,
          fontSize: Math.max(8, size * 0.42),
          "--brand-color": asset.color ?? "var(--chart-2)",
        } as CSSProperties
      }
    >
      {src && failed !== src ? (
        <img
          src={src}
          width={size}
          height={size}
          alt=""
          loading="lazy"
          decoding="async"
          className="provider-logo size-full object-contain"
          onError={() => setFailed(src)}
        />
      ) : (
        initials
      )}
    </span>
  );
}
