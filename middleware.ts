import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "fta_session";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Login page is always public.
  if (pathname === "/login") return NextResponse.next();

  // Public short links resolve at /{slug}/{code} (two segments, outside the
  // /companies dashboard area). These must never be gated.
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 2 && segments[0] !== "companies") {
    return NextResponse.next();
  }

  // Everything else (dashboard) requires the session cookie.
  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE)?.value);
  if (!hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Skip Next internals, favicon, and any file with an extension (static assets).
  matcher: ["/((?!_next|favicon.ico|.*\\..*).*)"],
};
