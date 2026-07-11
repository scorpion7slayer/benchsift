import {
  lazy,
  Suspense,
  useEffect,
  useState,
  type ComponentType,
} from "react";

interface IconProps {
  provider: string;
  size?: number;
  iconUrl?: string | null;
}

// `import.meta.env.SSR` is a compile-time constant, so on the server build the
// `import()` below is dead code - @lobehub/icons (~4 MB) is never bundled into
// the server output. On the client it lazy-loads the real component.
// This is the equivalent of Next.js's `dynamic(..., { ssr: false })`.
const LazyModelProviderIcon: ComponentType<IconProps> | null = import.meta.env
  .SSR
  ? null
  : lazy(() =>
      import("./model-provider-icon").then((m) => ({
        default: m.ModelProviderIcon,
      })),
    );

export function ModelProviderIcon({ provider, size = 20, iconUrl }: IconProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const initials = provider
    .split(/[-_\s]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "AI";

  const placeholder = (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-md bg-primary/10 font-semibold text-primary"
      style={{ width: size, height: size, fontSize: Math.max(8, Math.round(size * 0.42)) }}
    >
      {initials}
    </span>
  );

  // Server render + first client paint: keep a useful monogram visible while
  // the real split icon loads, without introducing layout shift.
  if (!mounted || !LazyModelProviderIcon) return placeholder;

  return (
    <Suspense fallback={placeholder}>
      <LazyModelProviderIcon provider={provider} size={size} iconUrl={iconUrl} />
    </Suspense>
  );
}
