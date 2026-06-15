# FTA Link Shortener

A branded link shortener for **Frank Taylor & Associates**. Create companies, generate
short links under each company, and track clicks — all behind a single hardcoded password
(no user accounts). Built with Next.js (App Router), styled with the FTA design system
(gold `#E4AD25` on near-black ink, Hanken Grotesk).

Each company gets short links under its own path on the app's domain:

```
{your-app-origin}/{business-slug}/{short-code}
```

For example, on the deployed domain: `fta-short.link/acme-dental/HaB7hs`.
The displayed link and the working link are the same, set by `NEXT_PUBLIC_SITE_URL`.

## Storage (no separate database to manage)

The app uses a small storage layer with two interchangeable backends, chosen
automatically from the environment:

- **Local development** — data is saved to a JSON file at `./.data/db.json`. No accounts,
  no setup. Just run it.
- **Production (Vercel)** — when Upstash Redis / Vercel KV credentials are present, the app
  uses them instead so links persist and work for everyone.

> Why not just a file in production? Vercel runs on serverless functions with an ephemeral,
> read-only filesystem, so a file can't reliably store data there. Upstash Redis (added via
> the Vercel Marketplace in ~2 minutes) is the lightweight, persistent store used in prod.

## Features

- Password gate (one shared password, set via `APP_PASSWORD`) — no auth/users.
- Create companies; a URL-friendly slug is generated from the business name.
- Create short links under a company (auto-generated 6-char code, destination URL).
- Click tracking on every redirect (timestamp, referrer, user agent) + per-link counters.
- Per-link analytics: total clicks, last-14-days bar chart, and a recent-clicks table.

## Project structure

- `app/` — App Router pages, server actions (`app/actions.ts`), components.
- `app/[slug]/[code]/route.ts` — public redirect endpoint (logs a click, 302s to the target).
- `lib/store/` — storage abstraction: `store.ts` (interface), `file.ts` (local JSON file),
  `redis.ts` (Upstash Redis / Vercel KV), `index.ts` (auto-selects the backend).
- `lib/` — data access, slug + short-code helpers, URL helpers, auth/session.
- `middleware.ts` — gates the dashboard; leaves `/login` and `/{slug}/{code}` public.

## Setup

### 1. Install

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local`. For local dev you only need:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
APP_PASSWORD=choose-a-password
# leave the UPSTASH_* variables blank to use the local file store
```

### 3. Run

```bash
npm run dev
```

Open http://localhost:3000, sign in with `APP_PASSWORD`, add a company, then create links.
Your data lives in `./.data/db.json` (git-ignored).

## Deploy to Vercel

1. Push this folder to a Git repository and import it in Vercel (Next.js auto-detected).
2. In the Vercel project, open **Storage → Marketplace → Upstash → Redis** and create a
   database, then **connect** it to the project. This injects `UPSTASH_REDIS_REST_URL` and
   `UPSTASH_REDIS_REST_TOKEN` automatically.
3. Add the remaining env vars in the Vercel project settings:
   - `NEXT_PUBLIC_SITE_URL` = your deployed URL (e.g. `https://fta-short.link`)
   - `APP_PASSWORD` = your shared password
4. Deploy. Short links resolve at `https://fta-short.link/{slug}/{code}` and persist in
   Redis.

## Custom domain

The app is served from the custom domain `fta-short.link`:

1. Vercel → project → **Settings → Domains** → add `fta-short.link`.
2. At the domain registrar, add the DNS records Vercel shows (an `A` record on the apex
   pointing to Vercel's IP, or switch to Vercel's nameservers). Wait for verification + SSL.
3. Set `NEXT_PUBLIC_SITE_URL=https://fta-short.link` in the Vercel env vars and redeploy so
   the displayed/working short links use the new domain. No code changes needed.
