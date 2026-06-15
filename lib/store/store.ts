import type { Company, LinkRow, ClickRow } from "@/lib/types";

export type CreateResult<T> = { ok: true; value: T } | { ok: false; error: string };

/**
 * Storage contract shared by both backends (local JSON file and Upstash Redis).
 * The rest of the app only ever talks to this interface.
 */
export interface Store {
  listCompanies(): Promise<Company[]>;
  getCompany(slug: string): Promise<Company | null>;
  createCompany(name: string): Promise<CreateResult<Company>>;

  listLinks(slug: string): Promise<LinkRow[]>;
  getLink(slug: string, code: string): Promise<LinkRow | null>;
  createLink(
    slug: string,
    originalUrl: string,
    title: string | null
  ): Promise<CreateResult<LinkRow>>;

  /** Resolve a short link for redirecting, then record the click. */
  resolveAndTrack(
    slug: string,
    code: string,
    referrer: string | null,
    userAgent: string | null
  ): Promise<string | null>;

  recentClicks(slug: string, code: string, limit: number): Promise<ClickRow[]>;

  companyStats(slug: string): Promise<{ links: number; clicks: number }>;
}
