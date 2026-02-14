import { createMarkReadHandler } from "@/server/inbox/mark-read-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Compat: used by frontend utilities (POST).
export const POST = createMarkReadHandler("offer_requests");
