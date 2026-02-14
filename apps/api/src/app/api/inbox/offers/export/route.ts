import { offerRequestSchema } from "@prosektor/contracts";
import { createExportHandler, baseExportQuerySchema } from "@/server/inbox/export-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const exportOffersQuerySchema = baseExportQuerySchema;

export const GET = createExportHandler({
  tableName: "offer_requests",
  selectFields: "*",
  headers: [
    "id",
    "created_at",
    "full_name",
    "email",
    "phone",
    "company_name",
    "message",
    "is_read",
    "kvkk_accepted_at",
    "source",
  ],
  rowMapper: (o) => [
    o.id,
    o.created_at,
    o.full_name,
    o.email,
    o.phone,
    o.company_name ?? "",
    o.message ?? "",
    o.is_read,
    o.kvkk_accepted_at,
    o.source ?? {},
  ],
  filenamePrefix: "offers",
  searchFields: ["full_name", "email", "company_name"],
  rateLimitEndpoint: "inbox_offers_export",
  querySchema: exportOffersQuerySchema,
  itemSchema: offerRequestSchema,
});
