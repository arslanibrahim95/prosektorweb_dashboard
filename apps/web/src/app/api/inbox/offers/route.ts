import { listOfferRequestsResponseSchema, offerRequestSchema } from "@prosektor/contracts";
import { createInboxHandler, baseInboxQuerySchema } from "@/server/inbox";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const inboxOffersQuerySchema = baseInboxQuerySchema;

export const GET = createInboxHandler({
  tableName: "offer_requests",
  querySchema: inboxOffersQuerySchema,
  selectFields: "id,tenant_id,site_id,full_name,email,phone,company_name,message,kvkk_accepted_at,source,is_read,created_at",
  searchFields: ["full_name", "email", "company_name"],
  rateLimitEndpoint: "inbox_offers",
  cacheKeyPrefix: "offers",
  itemSchema: offerRequestSchema,
  responseSchema: listOfferRequestsResponseSchema,
});
