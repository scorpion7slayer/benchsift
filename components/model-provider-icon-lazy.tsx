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

export function ModelProviderIcon({ provider, size = 20 }: IconProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const placeholder = (
    <span
      aria-hidden
      style={{ display: "inline-block", width: size, height: size }}
    />
  );

  // Server render + first client paint: render a sized placeholder so layout
  // is stable; the real icon swaps in after hydration.
  if (!mounted || !LazyModelProviderIcon) return placeholder;

  return (
    <Suspense fallback={placeholder}>
      <LazyModelProviderIcon provider={provider} size={size} />
    </Suspense>
  );
}
