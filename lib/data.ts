import "server-only";
import { store } from "@/lib/store";
import type {
  Company,
  LinkRow,
  ClickRow,
  CompanyClickSeries,
} from "@/lib/types";

export type CompanyWithStats = Company & {
  link_count: number;
  click_total: number;
};

export async function getCompaniesWithStats(): Promise<CompanyWithStats[]> {
  const companies = await store.listCompanies();
  return Promise.all(
    companies.map(async (c) => {
      const stats = await store.companyStats(c.slug);
      return { ...c, link_count: stats.links, click_total: stats.clicks };
    })
  );
}

export async function getCompanyBySlug(slug: string): Promise<Company | null> {
  return store.getCompany(slug);
}

export async function getLinksForCompany(slug: string): Promise<LinkRow[]> {
  return store.listLinks(slug);
}

export async function getLink(slug: string, code: string): Promise<LinkRow | null> {
  return store.getLink(slug, code);
}

export async function getRecentClicks(
  slug: string,
  code: string,
  limit = 50
): Promise<ClickRow[]> {
  return store.recentClicks(slug, code, limit);
}

const MS_DAY = 86_400_000;

/**
 * Per-link daily click counts for the last `days` days (UTC buckets).
 * Used to drive the company time-series chart.
 */
export async function getCompanyClickSeries(
  slug: string,
  days: number
): Promise<CompanyClickSeries> {
  const links = await store.listLinks(slug);

  const now = Date.now();
  const dayKeys: string[] = [];
  const labels: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now - i * MS_DAY);
    const key = d.toISOString().slice(0, 10);
    dayKeys.push(key);
    labels.push(
      d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })
    );
  }
  const indexByKey = new Map(dayKeys.map((k, i) => [k, i]));
  const sinceMs = Date.parse(`${dayKeys[0]}T00:00:00.000Z`);

  const events = await store.companyClickEvents(slug, sinceMs);

  const perLink = new Map<string, number[]>();
  for (const l of links) perLink.set(l.short_code, new Array(days).fill(0));
  for (const e of events) {
    const arr = perLink.get(e.code);
    const di = indexByKey.get(e.created_at.slice(0, 10));
    if (arr && di !== undefined) arr[di] += 1;
  }

  return {
    dayKeys,
    labels,
    links: links.map((l) => {
      const daily = perLink.get(l.short_code) ?? new Array(days).fill(0);
      return {
        id: l.short_code,
        code: l.short_code,
        label: l.title || l.short_code,
        total: daily.reduce((n, x) => n + x, 0),
        daily,
      };
    }),
  };
}
