import { useState, type CSSProperties } from "react";
import { getBrandLogo, getBrandLogoCandidates } from "@/lib/brand-logos";

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
  const [failed, setFailed] = useState<string[]>([]);
  const candidate = getBrandLogoCandidates(provider, iconUrl).find((item) => !failed.includes(item.src));
  const src = candidate?.src;
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
      data-monochrome={candidate?.monochrome || undefined}
      style={
        {
          width: size,
          height: size,
          fontSize: Math.max(8, size * 0.42),
          "--brand-color": asset.color ?? "var(--chart-2)",
        } as CSSProperties
      }
    >
      {src ? (
        <img
          src={src}
          width={size}
          height={size}
          alt=""
          loading="lazy"
          decoding="async"
          className="provider-logo size-full object-contain"
          onError={() => setFailed((previous) => [...previous, src])}
        />
      ) : (
        initials
      )}
    </span>
  );
}
