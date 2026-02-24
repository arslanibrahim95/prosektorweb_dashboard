import { appointmentRequestSchema } from "@prosektor/contracts";
import { createExportHandler, baseExportQuerySchema } from "@/server/inbox/export-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const exportAppointmentsQuerySchema = baseExportQuerySchema;

export const GET = createExportHandler({
  tableName: "appointment_requests",
  selectFields: "*",
  headers: [
    "id",
    "created_at",
    "full_name",
    "email",
    "phone",
    "company_name",
    "message",
    "preferred_date",
    "preferred_time",
    "is_read",
    "kvkk_accepted_at",
    "source",
  ],
  rowMapper: (a) => [
    a.id,
    a.created_at,
    a.full_name,
    a.email,
    a.phone,
    a.company_name ?? "",
    a.message ?? "",
    a.preferred_date ?? "",
    a.preferred_time ?? "",
    a.is_read,
    a.kvkk_accepted_at,
    a.source ?? {},
  ],
  filenamePrefix: "appointments",
  searchFields: ["full_name", "email", "company_name"],
  rateLimitEndpoint: "inbox_appointments_export",
  querySchema: exportAppointmentsQuerySchema,
  itemSchema: appointmentRequestSchema,
});
