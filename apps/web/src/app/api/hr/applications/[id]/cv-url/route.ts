import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Compat: frontend utility expects this path.
export async function GET(req: Request, ctxRoute: { params: Promise<{ id: string }> }) {
  const { id } = await ctxRoute.params;
  const url = new URL(req.url);
  url.pathname = `/api/job-applications/${id}/cv-url`;
  url.search = "";
  return NextResponse.redirect(url, 307);
}
