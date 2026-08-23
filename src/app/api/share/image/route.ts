import { NextRequest, NextResponse } from "next/server";

/** Proxy ad images for share PDF/PNG (avoids Supabase storage CORS in the browser). */
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("url");
  if (!raw) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!supabaseUrl) {
    return NextResponse.json({ error: "Storage not configured" }, { status: 503 });
  }

  const allowedPrefix = `${supabaseUrl}/storage/v1/object/public/ad-images/`;
  if (!parsed.href.startsWith(allowedPrefix)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const upstream = await fetch(parsed.href, { cache: "force-cache" });
  if (!upstream.ok) {
    return NextResponse.json({ error: "Image not found" }, { status: upstream.status });
  }

  const bytes = await upstream.arrayBuffer();
  const contentType = upstream.headers.get("content-type") || "image/jpeg";

  return new NextResponse(bytes, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
