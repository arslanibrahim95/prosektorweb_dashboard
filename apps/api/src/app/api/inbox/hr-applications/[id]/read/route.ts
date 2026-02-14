import { createMarkReadHandler } from "@/server/inbox/mark-read-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Standardized to POST (was PATCH) to match other inbox routes.
export const POST = createMarkReadHandler("job_applications");
