import { createMarkReadHandler } from "@/server/inbox/mark-read-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Compat: frontend expects `/api/inbox/applications/:id/read` with POST.
export const POST = createMarkReadHandler("job_applications");
