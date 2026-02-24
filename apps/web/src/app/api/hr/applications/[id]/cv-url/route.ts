import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Compat: frontend utility expects this path.
export async function GET(req: Request, ctxRoute: { params: Promise<{ id: string }> }) {
  void req;
  const { id } = await ctxRoute.params;
  return NextResponse.redirect(`/api/job-applications/${encodeURIComponent(id)}/cv-url`, 301);
}
