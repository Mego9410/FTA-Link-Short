import Link from "next/link";

export default function NotFound() {
  return (
    <main className="login-wrap">
      <div className="login-card" style={{ textAlign: "center" }}>
        <p className="eyebrow">404</p>
        <h2 className="h2" style={{ margin: "8px 0 10px" }}>
          Page not found
        </h2>
        <p className="small" style={{ color: "var(--fg-2)", marginBottom: 24 }}>
          The page or short link you were looking for doesn&apos;t exist.
        </p>
        <Link href="/" className="btn btn-primary">
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
