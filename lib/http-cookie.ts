/** Reads a raw cookie value without assuming a space after each semicolon. */
export function readCookieValue(
  cookieHeader: string,
  name: string,
): string | undefined {
  const prefix = `${name}=`;
  for (const part of cookieHeader.split(";")) {
    const cookie = part.trimStart();
    if (cookie.startsWith(prefix)) return cookie.slice(prefix.length);
  }
  return undefined;
}
