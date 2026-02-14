import {
  jobApplicationSchema,
  listJobApplicationsResponseSchema,
  uuidSchema,
} from "@prosektor/contracts";
import { createInboxHandler, baseInboxQuerySchema } from "@/server/inbox";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const inboxApplicationsQuerySchema = baseInboxQuerySchema.extend({
  job_post_id: uuidSchema.optional(),
});

export const GET = createInboxHandler({
  tableName: "job_applications",
  querySchema: inboxApplicationsQuerySchema,
  selectFields: "id,tenant_id,site_id,job_post_id,full_name,email,phone,message,cv_path,kvkk_accepted_at,is_read,created_at,job_post:job_posts(id,title)",
  searchFields: ["full_name", "email"],
  rateLimitEndpoint: "inbox_applications",
  cacheKeyPrefix: "applications",
  itemSchema: jobApplicationSchema,
  responseSchema: listJobApplicationsResponseSchema,
  additionalFilters: (query, params) => {
    if (params.job_post_id) {
      return query.eq("job_post_id", params.job_post_id);
    }
    return query;
  },
  additionalCacheKeyParts: (params) => {
    return [params.job_post_id ?? ""];
  },
});
