import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "@/app/components/Nav";
import CreateLinkForm from "@/app/components/CreateLinkForm";
import CopyLink from "@/app/components/CopyLink";
import ClicksChart from "@/app/components/ClicksChart";
import {
  getCompanyBySlug,
  getLinksForCompany,
  getCompanyClickSeries,
} from "@/lib/data";
import { displayHost, workingUrl } from "@/lib/url";

export const dynamic = "force-dynamic";

export default async function CompanyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const company = await getCompanyBySlug(slug);
  if (!company) notFound();

  const links = await getLinksForCompany(company.slug);
  const totalClicks = links.reduce((n, l) => n + l.click_count, 0);
  const clickSeries = await getCompanyClickSeries(company.slug, 90);

  return (
    <>
      <Nav />
      <main className="container page">
        <div className="breadcrumb">
          <Link href="/">Dashboard</Link>
          <span aria-hidden>/</span>
          <span>{company.name}</span>
        </div>

        <div className="page-head">
          <div>
            <p className="eyebrow">Company</p>
            <h1 className="h1" style={{ marginTop: 8 }}>
              {company.name}
            </h1>
            <p className="lead">
              Short links for{" "}
              <span className="url-pretty">
                {displayHost()}/<span className="host">{company.slug}</span>
              </span>
            </p>
          </div>
        </div>

        <div className="stat-grid">
          <div className="stat">
            <div className="k">Short links</div>
            <div className="v">{links.length}</div>
          </div>
          <div className="stat">
            <div className="k">Total clicks</div>
            <div className="v">{totalClicks}</div>
          </div>
        </div>

        {links.length > 0 ? <ClicksChart series={clickSeries} /> : null}

        <div
          className="dash-split"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) 380px",
            gap: 32,
            alignItems: "start",
          }}
        >
          <section>
            <div className="section-title">
              <h2 className="h3 mb-0">Links</h2>
            </div>

            {links.length === 0 ? (
              <div className="empty">
                <h3>No links yet</h3>
                <p>Create your first short link for {company.name}.</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Short link</th>
                      <th>Destination</th>
                      <th style={{ textAlign: "right" }}>Clicks</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {links.map((l) => {
                      const working = workingUrl(company.slug, l.short_code);
                      return (
                        <tr key={l.id}>
                          <td>
                            <CopyLink
                              value={working}
                              display={
                                <>
                                  {displayHost()}/{company.slug}/
                                  <span className="host">{l.short_code}</span>
                                </>
                              }
                            />
                            {l.title ? (
                              <div className="meta" style={{ marginTop: 4 }}>
                                {l.title}
                              </div>
                            ) : null}
                          </td>
                          <td>
                            <a
                              href={l.original_url}
                              target="_blank"
                              rel="noreferrer"
                              className="truncate"
                              style={{ display: "block", color: "var(--fg-2)" }}
                              title={l.original_url}
                            >
                              {l.original_url}
                            </a>
                          </td>
                          <td className="num" style={{ textAlign: "right" }}>
                            {l.click_count}
                          </td>
                          <td>
                            <div className="flex gap-2" style={{ justifyContent: "flex-end" }}>
                              <Link
                                href={`/companies/${company.slug}/links/${l.id}`}
                                className="btn btn-ghost btn-sm"
                              >
                                Stats
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <aside>
            <CreateLinkForm slug={company.slug} />
          </aside>
        </div>
      </main>
      <footer className="foot">
        <div className="container">
          Frank Taylor &amp; Associates — internal link shortener.
        </div>
      </footer>
    </>
  );
}
