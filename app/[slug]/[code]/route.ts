import { NextResponse, type NextRequest } from "next/server";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

function notFound() {
  return new NextResponse(
    `<!doctype html><meta charset="utf-8"><title>Link not found</title>
     <body style="font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;color:#1A1A17">
       <div style="text-align:center">
         <h1 style="font-size:28px;margin:0 0 8px">Link not found</h1>
         <p style="color:#5E5E5A;margin:0">This short link doesn't exist or has been removed.</p>
       </div>
     </body>`,
    { status: 404, headers: { "content-type": "text/html; charset=utf-8" } }
  );
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; code: string }> }
) {
  const { slug, code } = await params;

  const destination = await store.resolveAndTrack(
    slug,
    code,
    req.headers.get("referer"),
    req.headers.get("user-agent")
  );
  if (!destination) return notFound();

  // 302 so destination edits are always honoured and clicks keep counting.
  return NextResponse.redirect(destination, 302);
}
