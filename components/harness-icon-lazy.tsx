import {
  lazy,
  Suspense,
  useEffect,
  useState,
  type ComponentType,
} from "react";

interface IconProps {
  slug: string;
  size?: number;
}

const LazyHarnessIcon: ComponentType<IconProps> | null = import.meta.env.SSR
  ? null
  : lazy(() =>
      import("./harness-icon").then((m) => ({
        default: m.HarnessIcon,
      })),
    );

export function HarnessIcon({ slug, size = 20 }: IconProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const placeholder = (
    <span
      aria-hidden
      style={{ display: "inline-block", width: size, height: size }}
    />
  );

  if (!mounted || !LazyHarnessIcon) return placeholder;

  return (
    <Suspense fallback={placeholder}>
      <LazyHarnessIcon slug={slug} size={size} />
    </Suspense>
  );
}
