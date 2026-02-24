import { contactMessageSchema, listContactMessagesResponseSchema } from "@prosektor/contracts";
import { createInboxHandler, baseInboxQuerySchema } from "@/server/inbox";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const inboxContactQuerySchema = baseInboxQuerySchema;

export const GET = createInboxHandler({
  tableName: "contact_messages",
  querySchema: inboxContactQuerySchema,
  selectFields: "id,tenant_id,site_id,full_name,email,phone,subject,message,kvkk_accepted_at,source,is_read,created_at",
  searchFields: ["full_name", "email", "subject"],
  rateLimitEndpoint: "inbox_contact",
  cacheKeyPrefix: "contact",
  itemSchema: contactMessageSchema,
  responseSchema: listContactMessagesResponseSchema,
});
