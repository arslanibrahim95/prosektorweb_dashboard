/**
 * Base query schema for inbox API routes
 * This schema contains common fields shared across all inbox types
 */

import { z } from "zod";
import { uuidSchema } from "@prosektor/contracts";
import { safeSearchParamSchema } from "@/server/api/postgrest-search";

/**
 * Base inbox query schema with common fields
 * Can be extended by specific inbox types with additional fields
 */
export const baseInboxQuerySchema = z
    .object({
        site_id: uuidSchema,
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(50),
        search: safeSearchParamSchema.optional(),
        status: z.enum(["read", "unread"]).optional(),
        date_from: z.string().min(1).optional(),
        date_to: z.string().min(1).optional(),
    })
    .strict();

export type BaseInboxQuery = z.infer<typeof baseInboxQuerySchema>;
