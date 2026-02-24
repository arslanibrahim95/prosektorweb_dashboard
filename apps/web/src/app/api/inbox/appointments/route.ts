import { listAppointmentRequestsResponseSchema, appointmentRequestSchema } from "@prosektor/contracts";
import { createInboxHandler, baseInboxQuerySchema } from "@/server/inbox";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const inboxAppointmentsQuerySchema = baseInboxQuerySchema;

export const GET = createInboxHandler({
  tableName: "appointment_requests",
  querySchema: inboxAppointmentsQuerySchema,
  selectFields: "id,tenant_id,site_id,full_name,email,phone,company_name,message,preferred_date,preferred_time,kvkk_accepted_at,source,is_read,created_at",
  searchFields: ["full_name", "email", "company_name"],
  rateLimitEndpoint: "inbox_appointments",
  cacheKeyPrefix: "appointments",
  itemSchema: appointmentRequestSchema,
  responseSchema: listAppointmentRequestsResponseSchema,
});
