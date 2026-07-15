import type { SVGProps } from "react";

export function BrandMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="M4 4h14.5l-2.25 4H4V4Z" />
      <path d="M4 10h10.75l-2.25 4H4v-4Z" />
      <path d="M17 10h3v4h-5.25L17 10Z" />
      <path d="M4 16h7.25L9 20H4v-4Z" />
      <path d="M13.5 16h4.25L20 20h-8.75l2.25-4Z" />
    </svg>
  );
}
