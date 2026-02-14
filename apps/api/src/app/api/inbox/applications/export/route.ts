import { jobApplicationSchema, uuidSchema } from "@prosektor/contracts";
import { createExportHandler, baseExportQuerySchema } from "@/server/inbox/export-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const exportApplicationsQuerySchema = baseExportQuerySchema.extend({
  job_post_id: uuidSchema.optional(),
});

export const GET = createExportHandler({
  tableName: "job_applications",
  selectFields: "*, job_post:job_posts(id,title)",
  headers: [
    "id",
    "created_at",
    "full_name",
    "email",
    "phone",
    "job_post_id",
    "job_post_title",
    "message",
    "is_read",
    "kvkk_accepted_at",
  ],
  rowMapper: (a) => [
    a.id,
    a.created_at,
    a.full_name,
    a.email,
    a.phone,
    a.job_post_id,
    a.job_post?.title ?? "",
    a.message ?? "",
    a.is_read,
    a.kvkk_accepted_at,
  ],
  filenamePrefix: "applications",
  searchFields: ["full_name", "email"],
  rateLimitEndpoint: "inbox_applications_export",
  querySchema: exportApplicationsQuerySchema,
  itemSchema: jobApplicationSchema,
  additionalFilters: (query, params) => {
    if (params.job_post_id) {
      return query.eq("job_post_id", params.job_post_id);
    }
    return query;
  },
});
