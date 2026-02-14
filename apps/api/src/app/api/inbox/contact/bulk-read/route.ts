import { createBulkReadHandler } from "@/server/inbox/bulk-read-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = createBulkReadHandler("contact_messages");
