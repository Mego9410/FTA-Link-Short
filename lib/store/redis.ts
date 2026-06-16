import "server-only";
import { Redis } from "@upstash/redis";
import type { Company, LinkRow, ClickRow } from "@/lib/types";
import { slugify } from "@/lib/slug";
import { makeShortCode } from "@/lib/shortcode";
import type { Store, CreateResult, ClickEvent } from "./store";

type StoredCompany = { name: string; slug: string; created_at: string };
type StoredLink = {
  slug: string;
  code: string;
  original_url: string;
  title: string | null;
  created_at: string;
};
type StoredClick = {
  created_at: string;
  referrer: string | null;
  user_agent: string | null;
};

export function hasRedisEnv(): boolean {
  return Boolean(
    (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL) &&
      (process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN)
  );
}

let client: Redis | null = null;
function redis(): Redis {
  if (client) return client;
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) {
    throw new Error("Missing Upstash/Vercel KV credentials.");
  }
  client = new Redis({ url, token });
  return client;
}

const kCompanies = "companies";
const kCompany = (slug: string) => `company:${slug}`;
const kLinks = (slug: string) => `links:${slug}`;
const kLink = (slug: string, code: string) => `link:${slug}:${code}`;
const kCount = (slug: string, code: string) => `count:${slug}:${code}`;
const kCompanyClicks = (slug: string) => `ccount:${slug}`;
const kClicks = (slug: string, code: string) => `clicks:${slug}:${code}`;

const CLICK_CAP = 1000;

async function linkRow(r: Redis, stored: StoredLink): Promise<LinkRow> {
  const count = (await r.get<number>(kCount(stored.slug, stored.code))) ?? 0;
  return {
    id: stored.code,
    slug: stored.slug,
    original_url: stored.original_url,
    short_code: stored.code,
    title: stored.title,
    click_count: count,
    created_at: stored.created_at,
  };
}

export const redisStore: Store = {
  async listCompanies(): Promise<Company[]> {
    const r = redis();
    const slugs = await r.zrange<string[]>(kCompanies, 0, -1, { rev: true });
    if (!slugs.length) return [];
    const records = await Promise.all(
      slugs.map((s) => r.get<StoredCompany>(kCompany(s)))
    );
    return records
      .filter((c): c is StoredCompany => Boolean(c))
      .map((c) => ({ id: c.slug, ...c }));
  },

  async getCompany(slug: string): Promise<Company | null> {
    const c = await redis().get<StoredCompany>(kCompany(slug));
    return c ? { id: c.slug, ...c } : null;
  },

  async createCompany(name: string): Promise<CreateResult<Company>> {
    const trimmed = name.trim();
    if (!trimmed) return { ok: false, error: "Please enter a business name." };
    const base = slugify(trimmed);
    if (!base)
      return { ok: false, error: "That name can't be turned into a URL. Try another." };

    const r = redis();
    let slug = base;
    for (let i = 2; (await r.exists(kCompany(slug))) === 1; i++) {
      slug = `${base}-${i}`;
    }
    const company: StoredCompany = {
      name: trimmed,
      slug,
      created_at: new Date().toISOString(),
    };
    await r.set(kCompany(slug), company);
    await r.zadd(kCompanies, { score: Date.now(), member: slug });
    return { ok: true, value: { id: slug, ...company } };
  },

  async renameCompany(slug: string, name: string): Promise<CreateResult<Company>> {
    const trimmed = name.trim();
    if (!trimmed) return { ok: false, error: "Please enter a business name." };

    const r = redis();
    const company = await r.get<StoredCompany>(kCompany(slug));
    if (!company) return { ok: false, error: "Company not found." };
    const updated: StoredCompany = { ...company, name: trimmed };
    await r.set(kCompany(slug), updated);
    return { ok: true, value: { id: slug, ...updated } };
  },

  async deleteCompany(slug: string): Promise<void> {
    const r = redis();
    const codes = await r.zrange<string[]>(kLinks(slug), 0, -1);
    const keys: string[] = [];
    for (const code of codes) {
      keys.push(kLink(slug, code), kCount(slug, code), kClicks(slug, code));
    }
    keys.push(kLinks(slug), kCompany(slug), kCompanyClicks(slug));
    const pipe = r.pipeline();
    pipe.del(...keys);
    pipe.zrem(kCompanies, slug);
    await pipe.exec();
  },

  async listLinks(slug: string): Promise<LinkRow[]> {
    const r = redis();
    const codes = await r.zrange<string[]>(kLinks(slug), 0, -1, { rev: true });
    if (!codes.length) return [];
    const stored = await Promise.all(
      codes.map((code) => r.get<StoredLink>(kLink(slug, code)))
    );
    const present = stored.filter((l): l is StoredLink => Boolean(l));
    return Promise.all(present.map((l) => linkRow(r, l)));
  },

  async getLink(slug: string, code: string): Promise<LinkRow | null> {
    const r = redis();
    const stored = await r.get<StoredLink>(kLink(slug, code));
    return stored ? linkRow(r, stored) : null;
  },

  async createLink(
    slug: string,
    originalUrl: string,
    title: string | null
  ): Promise<CreateResult<LinkRow>> {
    const r = redis();
    if ((await r.exists(kCompany(slug))) !== 1) {
      return { ok: false, error: "Company not found." };
    }
    let code = makeShortCode(6);
    for (let i = 0; (await r.exists(kLink(slug, code))) === 1 && i < 8; i++) {
      code = makeShortCode(6);
    }
    const link: StoredLink = {
      slug,
      code,
      original_url: originalUrl,
      title: title || null,
      created_at: new Date().toISOString(),
    };
    await r.set(kLink(slug, code), link);
    await r.zadd(kLinks(slug), { score: Date.now(), member: code });
    return { ok: true, value: await linkRow(r, link) };
  },

  async deleteLink(slug: string, code: string): Promise<void> {
    const r = redis();
    // Keep the company-wide click counter consistent by subtracting this
    // link's clicks before removing its keys.
    const count = (await r.get<number>(kCount(slug, code))) ?? 0;
    const pipe = r.pipeline();
    pipe.del(kLink(slug, code), kCount(slug, code), kClicks(slug, code));
    pipe.zrem(kLinks(slug), code);
    if (count > 0) pipe.decrby(kCompanyClicks(slug), count);
    await pipe.exec();
  },

  async resolveAndTrack(
    slug: string,
    code: string,
    referrer: string | null,
    userAgent: string | null
  ): Promise<string | null> {
    const r = redis();
    const stored = await r.get<StoredLink>(kLink(slug, code));
    if (!stored) return null;

    const click: StoredClick = {
      created_at: new Date().toISOString(),
      referrer,
      user_agent: userAgent,
    };
    const pipe = r.pipeline();
    pipe.lpush(kClicks(slug, code), click);
    pipe.ltrim(kClicks(slug, code), 0, CLICK_CAP - 1);
    pipe.incr(kCount(slug, code));
    pipe.incr(kCompanyClicks(slug));
    await pipe.exec();

    return stored.original_url;
  },

  async recentClicks(slug: string, code: string, limit: number): Promise<ClickRow[]> {
    const r = redis();
    const items = await r.lrange<StoredClick>(kClicks(slug, code), 0, limit - 1);
    return items.map((c) => ({
      created_at: c.created_at,
      referrer: c.referrer,
      user_agent: c.user_agent,
    }));
  },

  async companyClickEvents(slug: string, sinceMs: number): Promise<ClickEvent[]> {
    const r = redis();
    const codes = await r.zrange<string[]>(kLinks(slug), 0, -1, { rev: true });
    if (!codes.length) return [];
    const lists = await Promise.all(
      codes.map((code) => r.lrange<StoredClick>(kClicks(slug, code), 0, CLICK_CAP - 1))
    );
    const out: ClickEvent[] = [];
    codes.forEach((code, i) => {
      for (const c of lists[i]) {
        if (c && new Date(c.created_at).getTime() >= sinceMs) {
          out.push({ code, created_at: c.created_at });
        }
      }
    });
    return out;
  },

  async companyStats(slug: string): Promise<{ links: number; clicks: number }> {
    const r = redis();
    const [links, clicks] = await Promise.all([
      r.zcard(kLinks(slug)),
      r.get<number>(kCompanyClicks(slug)),
    ]);
    return { links: links ?? 0, clicks: clicks ?? 0 };
  },
};
