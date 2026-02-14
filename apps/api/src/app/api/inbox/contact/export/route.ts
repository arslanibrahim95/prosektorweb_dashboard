import { contactMessageSchema } from "@prosektor/contracts";
import { createExportHandler, baseExportQuerySchema } from "@/server/inbox/export-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const exportContactQuerySchema = baseExportQuerySchema;

export const GET = createExportHandler({
  tableName: "contact_messages",
  selectFields: "*",
  headers: [
    "id",
    "created_at",
    "full_name",
    "email",
    "phone",
    "subject",
    "message",
    "is_read",
    "kvkk_accepted_at",
    "source",
  ],
  rowMapper: (m) => [
    m.id,
    m.created_at,
    m.full_name,
    m.email,
    m.phone,
    m.subject ?? "",
    m.message,
    m.is_read,
    m.kvkk_accepted_at,
    m.source ?? {},
  ],
  filenamePrefix: "contact",
  searchFields: ["full_name", "email", "subject"],
  rateLimitEndpoint: "inbox_contact_export",
  querySchema: exportContactQuerySchema,
  itemSchema: contactMessageSchema,
});
