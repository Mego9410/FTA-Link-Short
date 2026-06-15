import "server-only";
import { store } from "@/lib/store";
import type { Company, LinkRow, ClickRow } from "@/lib/types";

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
