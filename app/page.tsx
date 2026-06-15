import Link from "next/link";
import Nav from "@/app/components/Nav";
import CreateCompanyForm from "@/app/components/CreateCompanyForm";
import { getCompaniesWithStats } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const companies = await getCompaniesWithStats();

  const totalLinks = companies.reduce((n, c) => n + c.link_count, 0);
  const totalClicks = companies.reduce((n, c) => n + c.click_total, 0);

  return (
    <>
      <Nav />
      <main className="container page">
        <div className="page-head">
          <div>
            <p className="eyebrow">Dashboard</p>
            <h1 className="h1" style={{ marginTop: 8 }}>
              Companies and short links
            </h1>
            <p className="lead">
              Create a company, generate branded short links, and track every click
              in one place.
            </p>
          </div>
        </div>

        <div className="stat-grid">
          <div className="stat">
            <div className="k">Companies</div>
            <div className="v">{companies.length}</div>
          </div>
          <div className="stat">
            <div className="k">Short links</div>
            <div className="v">{totalLinks}</div>
          </div>
          <div className="stat">
            <div className="k">Total clicks</div>
            <div className="v">{totalClicks}</div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) 380px",
            gap: 32,
            alignItems: "start",
          }}
          className="dash-split"
        >
          <section>
            <div className="section-title">
              <h2 className="h3 mb-0">Your companies</h2>
            </div>

            {companies.length === 0 ? (
              <div className="empty">
                <h3>No companies yet</h3>
                <p>Add your first company to start creating branded short links.</p>
              </div>
            ) : (
              <div className="grid-3">
                {companies.map((c) => (
                  <Link
                    key={c.id}
                    href={`/companies/${c.slug}`}
                    className="feature-card"
                  >
                    <div className="row-between">
                      <h4>{c.name}</h4>
                    </div>
                    <p className="meta" style={{ marginTop: -6 }}>
                      {c.slug}
                    </p>
                    <div className="row-between mt-2">
                      <span className="badge badge-neutral">
                        {c.link_count} link{c.link_count === 1 ? "" : "s"}
                      </span>
                      <span className="badge badge-gold">
                        {c.click_total} click{c.click_total === 1 ? "" : "s"}
                      </span>
                    </div>
                    <span className="link-gold mt-2">
                      Manage links{" "}
                      <span className="arw" aria-hidden>
                        →
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <aside>
            <CreateCompanyForm />
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
