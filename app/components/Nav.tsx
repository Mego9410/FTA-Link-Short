import Link from "next/link";
import { logout } from "@/app/actions";

export default function Nav() {
  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link href="/" className="nav-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Frank Taylor & Associates" />
          <span className="name">Link shortener</span>
        </Link>
        <nav className="nav-links">
          <Link href="/" className="btn btn-ghost btn-sm">
            Dashboard
          </Link>
          <form action={logout}>
            <button type="submit" className="btn btn-outline-ink btn-sm">
              Sign out
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
