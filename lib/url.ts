/** Display-only "pretty" link: www.{slug}.{brandDomain}/{code} */
export function prettyUrl(slug: string, code: string): string {
  const domain = process.env.NEXT_PUBLIC_BRAND_DOMAIN || "myURL.com";
  return `www.${slug}.${domain}/${code}`;
}

/** The actual working short link that resolves the redirect. */
export function workingUrl(slug: string, code: string): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(
    /\/+$/,
    ""
  );
  return `${base}/${slug}/${code}`;
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
