import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Compat alias: UI uses `/api/inbox/applications` while backend model calls it HR applications.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const target = new URL("/api/inbox/hr-applications", url.origin);
  target.search = url.search;
  return NextResponse.redirect(target, 307);
}
