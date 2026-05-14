import { Link as TanStackLink } from "@tanstack/react-router";
import type { AnchorHTMLAttributes, ReactNode } from "react";

interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  href: string;
  children?: ReactNode;
}

/**
 * Thin wrapper over TanStack Router's `<Link>` that keeps the Next.js
 * `<Link href>` call-site shape, so components migrated from Next.js need
 * only swap the import. TanStack's `Link` is typed against known routes;
 * the `as never` cast lets us pass already-resolved path strings
 * (e.g. `/models/<slug>`), which the router resolves fine at runtime.
 */
export function Link({ href, children, ...rest }: LinkProps) {
  return (
    <TanStackLink to={href as never} {...rest}>
      {children}
    </TanStackLink>
  );
}
