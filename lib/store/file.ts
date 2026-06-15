import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Company, LinkRow, ClickRow } from "@/lib/types";
import { slugify } from "@/lib/slug";
import { makeShortCode } from "@/lib/shortcode";
import type { Store, CreateResult, ClickEvent } from "./store";

type RawCompany = { name: string; slug: string; created_at: string };
type RawLink = {
  slug: string;
  code: string;
  original_url: string;
  title: string | null;
  created_at: string;
};
type RawClick = {
  slug: string;
  code: string;
  created_at: string;
  referrer: string | null;
  user_agent: string | null;
};
type DB = { companies: RawCompany[]; links: RawLink[]; clicks: RawClick[] };

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_PATH = path.join(DATA_DIR, "db.json");

const EMPTY: DB = { companies: [], links: [], clicks: [] };

// Serialize all file access so concurrent requests don't clobber each other.
let queue: Promise<unknown> = Promise.resolve();
function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

async function readDB(): Promise<DB> {
  try {
    const raw = await fs.readFile(DB_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<DB>;
    return {
      companies: parsed.companies ?? [],
      links: parsed.links ?? [],
      clicks: parsed.clicks ?? [],
    };
  } catch {
    return { ...EMPTY };
  }
}

async function writeDB(db: DB): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${DB_PATH}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
  await fs.rename(tmp, DB_PATH);
}

function countClicks(db: DB, slug: string, code: string): number {
  return db.clicks.filter((c) => c.slug === slug && c.code === code).length;
}

function toLinkRow(db: DB, l: RawLink): LinkRow {
  return {
    id: l.code,
    slug: l.slug,
    original_url: l.original_url,
    short_code: l.code,
    title: l.title,
    click_count: countClicks(db, l.slug, l.code),
    created_at: l.created_at,
  };
}

export const fileStore: Store = {
  async listCompanies(): Promise<Company[]> {
    const db = await readDB();
    return db.companies
      .map((c) => ({ id: c.slug, ...c }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  async getCompany(slug: string): Promise<Company | null> {
    const db = await readDB();
    const c = db.companies.find((x) => x.slug === slug);
    return c ? { id: c.slug, ...c } : null;
  },

  async createCompany(name: string): Promise<CreateResult<Company>> {
    const trimmed = name.trim();
    if (!trimmed) return { ok: false, error: "Please enter a business name." };
    const base = slugify(trimmed);
    if (!base)
      return { ok: false, error: "That name can't be turned into a URL. Try another." };

    return withLock(async () => {
      const db = await readDB();
      let slug = base;
      for (let i = 2; db.companies.some((c) => c.slug === slug); i++) {
        slug = `${base}-${i}`;
      }
      const company: RawCompany = {
        name: trimmed,
        slug,
        created_at: new Date().toISOString(),
      };
      db.companies.push(company);
      await writeDB(db);
      return { ok: true, value: { id: slug, ...company } };
    });
  },

  async listLinks(slug: string): Promise<LinkRow[]> {
    const db = await readDB();
    return db.links
      .filter((l) => l.slug === slug)
      .map((l) => toLinkRow(db, l))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  async getLink(slug: string, code: string): Promise<LinkRow | null> {
    const db = await readDB();
    const l = db.links.find((x) => x.slug === slug && x.code === code);
    return l ? toLinkRow(db, l) : null;
  },

  async createLink(
    slug: string,
    originalUrl: string,
    title: string | null
  ): Promise<CreateResult<LinkRow>> {
    return withLock(async () => {
      const db = await readDB();
      if (!db.companies.some((c) => c.slug === slug)) {
        return { ok: false, error: "Company not found." };
      }
      let code = makeShortCode(6);
      for (
        let i = 0;
        db.links.some((l) => l.slug === slug && l.code === code) && i < 8;
        i++
      ) {
        code = makeShortCode(6);
      }
      const link: RawLink = {
        slug,
        code,
        original_url: originalUrl,
        title: title || null,
        created_at: new Date().toISOString(),
      };
      db.links.push(link);
      await writeDB(db);
      return { ok: true, value: toLinkRow(db, link) };
    });
  },

  async resolveAndTrack(
    slug: string,
    code: string,
    referrer: string | null,
    userAgent: string | null
  ): Promise<string | null> {
    return withLock(async () => {
      const db = await readDB();
      const link = db.links.find((l) => l.slug === slug && l.code === code);
      if (!link) return null;
      db.clicks.push({
        slug,
        code,
        created_at: new Date().toISOString(),
        referrer,
        user_agent: userAgent,
      });
      await writeDB(db);
      return link.original_url;
    });
  },

  async recentClicks(slug: string, code: string, limit: number): Promise<ClickRow[]> {
    const db = await readDB();
    return db.clicks
      .filter((c) => c.slug === slug && c.code === code)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, limit)
      .map((c) => ({
        created_at: c.created_at,
        referrer: c.referrer,
        user_agent: c.user_agent,
      }));
  },

  async companyClickEvents(slug: string, sinceMs: number): Promise<ClickEvent[]> {
    const db = await readDB();
    return db.clicks
      .filter(
        (c) => c.slug === slug && new Date(c.created_at).getTime() >= sinceMs
      )
      .map((c) => ({ code: c.code, created_at: c.created_at }));
  },

  async companyStats(slug: string): Promise<{ links: number; clicks: number }> {
    const db = await readDB();
    const links = db.links.filter((l) => l.slug === slug).length;
    const clicks = db.clicks.filter((c) => c.slug === slug).length;
    return { links, clicks };
  },
};
