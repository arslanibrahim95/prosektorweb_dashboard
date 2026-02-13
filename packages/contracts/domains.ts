import { z } from "zod";
import { isoDateTimeSchema, uuidSchema } from "./common";

export const domainStatusSchema = z.enum(["pending", "verified", "active", "failed"]);
export type DomainStatus = z.infer<typeof domainStatusSchema>;

// `ssl_status` isn't constrained at DB-level (yet). Keep it flexible.
export const sslStatusSchema = z.string().min(1).max(64);

export const domainNameSchema = z
  .string()
  .min(1)
  .max(255)
  // e.g. example.com, www.example.com
  .regex(/^[a-z0-9.-]+\.[a-z0-9-]+$/i, "Invalid domain");

export const domainSchema = z.object({
  id: uuidSchema,
  tenant_id: uuidSchema,
  site_id: uuidSchema,
  domain: domainNameSchema,
  status: domainStatusSchema,
  ssl_status: sslStatusSchema,
  is_primary: z.boolean(),
  verified_at: isoDateTimeSchema.nullable().optional(),
  created_at: isoDateTimeSchema,
  updated_at: isoDateTimeSchema,
});
export type Domain = z.infer<typeof domainSchema>;

export const listDomainsQuerySchema = z
  .object({
    site_id: uuidSchema,
  })
  .strict();

export const listDomainsResponseSchema = z.object({
  items: z.array(domainSchema),
  total: z.number().int(),
});

export const createDomainRequestSchema = z
  .object({
    site_id: uuidSchema,
    domain: domainNameSchema,
    is_primary: z.boolean().optional(),
  })
  .strict();

export const updateDomainRequestSchema = z
  .object({
    is_primary: z.boolean().optional(),
  })
  .strict();

