import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "@/app/components/Nav";
import CopyButton from "@/app/components/CopyButton";
import { getCompanyBySlug, getLink, getRecentClicks } from "@/lib/data";
import { prettyUrl, workingUrl } from "@/lib/url";

export const dynamic = "force-dynamic";

const DAYS = 14;

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default async function LinkStatsPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const company = await getCompanyBySlug(slug);
  if (!company) notFound();

  const link = await getLink(slug, id);
  if (!link) notFound();

  const clicks = await getRecentClicks(slug, link.short_code, 1000);

  // Build a 14-day-by-day series.
  const counts = new Map<string, number>();
  for (const c of clicks) {
    const key = dayKey(new Date(c.created_at));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const series: { label: string; key: string; count: number }[] = [];
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = dayKey(d);
    series.push({
      key,
      label: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      count: counts.get(key) ?? 0,
    });
  }
  const max = Math.max(1, ...series.map((s) => s.count));

  const pretty = prettyUrl(company.slug, link.short_code);
  const working = workingUrl(company.slug, link.short_code);

  return (
    <>
      <Nav />
      <main className="container page">
        <div className="breadcrumb">
          <Link href="/">Dashboard</Link>
          <span aria-hidden>/</span>
          <Link href={`/companies/${company.slug}`}>{company.name}</Link>
          <span aria-hidden>/</span>
          <span>{link.short_code}</span>
        </div>

        <div className="page-head">
          <div>
            <p className="eyebrow">Link analytics</p>
            <h1 className="h1" style={{ marginTop: 8 }}>
              {link.title || link.short_code}
            </h1>
            <p className="lead url-pretty">
              www.<span className="host">{company.slug}</span>.
              {process.env.NEXT_PUBLIC_BRAND_DOMAIN || "myURL.com"}/
              <span className="host">{link.short_code}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <CopyButton value={working} label="Copy short link" />
            <a
              href={link.original_url}
              target="_blank"
              rel="noreferrer"
              className="btn btn-outline-ink btn-sm"
            >
              Open destination
            </a>
          </div>
        </div>

        <div className="stat-grid">
          <div className="stat">
            <div className="k">Total clicks</div>
            <div className="v">{link.click_count}</div>
          </div>
          <div className="stat">
            <div className="k">Last {DAYS} days</div>
            <div className="v">{series.reduce((n, s) => n + s.count, 0)}</div>
          </div>
          <div className="stat">
            <div className="k">Created</div>
            <div className="v" style={{ fontSize: 22 }}>
              {new Date(link.created_at).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </div>
          </div>
        </div>

        <div className="panel" style={{ marginBottom: 32 }}>
          <h3 className="h3" style={{ marginBottom: 6 }}>
            Clicks over the last {DAYS} days
          </h3>
          <p className="meta" style={{ marginBottom: 16 }}>
            Destination:{" "}
            <a href={link.original_url} target="_blank" rel="noreferrer" className="link-gold">
              {link.original_url}
            </a>
          </p>
          <div className="bars">
            {series.map((s) => (
              <div className="bar-col" key={s.key}>
                <span className="bar-count">{s.count || ""}</span>
                <div className="bar-track">
                  <div
                    className={`bar-fill${s.count === 0 ? " zero" : ""}`}
                    style={{ height: `${Math.max(2, (s.count / max) * 130)}px` }}
                  />
                </div>
                <span className="bar-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="section-title">
          <h2 className="h3 mb-0">Recent clicks</h2>
          <span className="meta">Pretty URL: {pretty}</span>
        </div>

        {clicks.length === 0 ? (
          <div className="empty">
            <h3>No clicks yet</h3>
            <p>Share the short link — clicks will appear here in real time.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Referrer</th>
                  <th>Device / browser</th>
                </tr>
              </thead>
              <tbody>
                {clicks.slice(0, 100).map((c, i) => (
                  <tr key={`${c.created_at}-${i}`}>
                    <td className="num" style={{ fontWeight: 500, color: "var(--fg-2)" }}>
                      {new Date(c.created_at).toLocaleString("en-GB")}
                    </td>
                    <td>{c.referrer || <span className="meta">Direct</span>}</td>
                    <td>
                      <span className="truncate" style={{ display: "block" }} title={c.user_agent || ""}>
                        {c.user_agent || <span className="meta">Unknown</span>}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
      <footer className="foot">
        <div className="container">
          Frank Taylor &amp; Associates — internal link shortener.
        </div>
      </footer>
    </>
  );
}
