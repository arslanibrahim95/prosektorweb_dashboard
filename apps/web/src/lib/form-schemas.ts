import { z } from 'zod';

/**
 * Centralized form validation schemas (Turkish messages)
 */

export const contactModuleFormSchema = z.object({
  isFormEnabled: z.boolean(),
  address: z.string().optional(),
  phones: z.array(z.string()),
  emails: z.array(z.string().email('Geçerli bir email adresi girin')),
  recipientEmails: z
    .array(z.string().email('Geçerli bir email adresi girin'))
    .min(1, 'En az bir bildirim alıcısı ekleyin'),
  mapEmbedUrl: z
    .string()
    .url('Geçerli bir URL girin')
    .or(z.literal(''))
    .optional(),
  successMessage: z.string().optional(),
  selectedKvkkId: z.string().optional(),
});

export type ContactModuleFormData = z.infer<typeof contactModuleFormSchema>;

export const jobPostFormSchema = z.object({
  title: z.string().min(1, 'Başlık zorunludur').max(200, 'Başlık çok uzun'),
  slug: z
    .string()
    .min(1, 'Slug zorunludur')
    .regex(/^[a-z0-9-]+$/, 'Sadece küçük harf, rakam ve tire kullanın'),
  location: z.string().optional(),
  employment_type: z.enum(['full-time', 'part-time', 'contract', '']).optional(),
  description: z.string().optional(),
  requirements: z.string().optional(),
  is_active: z.boolean(),
});

export type JobPostFormData = z.infer<typeof jobPostFormSchema>;

export const inviteMemberFormSchema = z.object({
  email: z.string().min(1, 'Email zorunludur').email('Geçerli bir email adresi girin'),
  role: z.enum(['admin', 'editor', 'viewer']),
});

export type InviteMemberFormData = z.infer<typeof inviteMemberFormSchema>;

export const legalTextFormSchema = z.object({
  title: z.string().min(1, 'Başlık zorunludur').max(200, 'Başlık çok uzun'),
  type: z.enum(['kvkk', 'consent', 'terms', 'privacy', 'disclosure']),
  content: z.string().min(1, 'İçerik zorunludur'),
  is_active: z.boolean(),
});

export type LegalTextFormData = z.infer<typeof legalTextFormSchema>;

export const domainFormSchema = z.object({
  domain: z
    .string()
    .min(1, 'Domain zorunludur')
    .regex(
      /^([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/,
      'Geçerli bir domain adı girin (örn: example.com)',
    ),
});

export type DomainFormData = z.infer<typeof domainFormSchema>;
