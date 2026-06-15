function siteBase(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(
    /\/+$/,
    ""
  );
}

/** The deployment host without scheme, e.g. "fta-link.vercel.app". */
export function displayHost(): string {
  return siteBase().replace(/^https?:\/\//, "");
}

/** The actual working short link (with scheme) — used for copying and links. */
export function workingUrl(slug: string, code: string): string {
  return `${siteBase()}/${slug}/${code}`;
}

/** Display version of the short link without the scheme, e.g. host/slug/code. */
export function displayUrl(slug: string, code: string): string {
  return `${displayHost()}/${slug}/${code}`;
}

/**
 * Normalize a user-entered destination URL. Adds https:// when no scheme is
 * present and validates it parses. Returns null when invalid.
 */
export function normalizeUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const u = new URL(withScheme);
    if (!u.hostname.includes(".")) return null;
    return u.toString();
  } catch {
    return null;
  }
}
