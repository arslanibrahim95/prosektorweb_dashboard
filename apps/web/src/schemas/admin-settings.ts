import { z } from "zod";

/**
 * Color validation supports:
 * - #fff / #ffffff
 * - rgb(255, 255, 255)
 * - rgba(255, 255, 255, 0.5)
 */
const rgbChannel = "(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)";
const alphaChannel = "(?:0|1|0?\\.\\d+)";

const hexColorRegex = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const rgbColorRegex = new RegExp(
    `^rgb\\(\\s*${rgbChannel}\\s*,\\s*${rgbChannel}\\s*,\\s*${rgbChannel}\\s*\\)$`,
);
const rgbaColorRegex = new RegExp(
    `^rgba\\(\\s*${rgbChannel}\\s*,\\s*${rgbChannel}\\s*,\\s*${rgbChannel}\\s*,\\s*${alphaChannel}\\s*\\)$`,
);

function isSupportedColorFormat(value: string): boolean {
    return (
        hexColorRegex.test(value) ||
        rgbColorRegex.test(value) ||
        rgbaColorRegex.test(value)
    );
}

const colorField = z
    .string()
    .refine(isSupportedColorFormat, "Geçersiz renk formatı")
    .optional();

export const backupSettingsSchema = z.object({
    auto_backup: z.boolean().optional(),
    frequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
    retention_period: z.enum(['7', '30', '90', '365']).optional(),
    location: z.enum(['local', 's3', 'gcs']).optional(),
    include: z.object({
        database: z.boolean().optional(),
        media: z.boolean().optional(),
        config: z.boolean().optional(),
        logs: z.boolean().optional(),
    }).strict().optional(),
}).strict();

export const i18nSettingsSchema = z
    .object({
        defaultLanguage: z.string().min(2).max(10).optional(),
        enabledLanguages: z.array(z.string().min(2).max(10)).optional(),
        translations: z.record(
            z.string().min(2).max(10),
            z.record(z.string().min(1).max(256), z.string().max(4000)),
        ).optional(),
        languages: z
            .array(
                z.object({
                    id: z.string(),
                    name: z.string(),
                    code: z.string().min(2).max(10),
                    status: z.enum(["active", "inactive"]),
                    isDefault: z.boolean(),
                    progress: z.number().min(0).max(100),
                }).strict(),
            )
            .optional(),
    })
    .strict()
    .refine(
        (data) => {
            if (data.defaultLanguage && data.enabledLanguages) {
                return data.enabledLanguages.includes(data.defaultLanguage);
            }
            return true;
        },
        {
            message: "defaultLanguage, enabledLanguages listesinde olmalı",
            path: ["defaultLanguage"],
        },
    )
    .refine(
        (data) => {
            if (!data.languages) return true;
            const codes = data.languages.map((l) => l.code.trim().toLowerCase());
            return codes.length === new Set(codes).size;
        },
        {
            message: "Dil kodları benzersiz olmalı",
            path: ["languages"],
        },
    );

export const themeSettingsSchema = z.object({
    colors: z.object({
        primary: colorField,
        secondary: colorField,
        accent: colorField,
        background: colorField,
        text: colorField,
        success: colorField,
        warning: colorField,
        error: colorField,
    }).strict().optional(),
    fontFamily: z.enum(['inter', 'roboto', 'open-sans', 'poppins', 'nunito']).optional(),
    baseFontSize: z.number().int().min(12).max(24).optional(),
    headingFont: z.enum(['inter', 'roboto', 'open-sans', 'poppins', 'nunito']).optional(),
    lineHeight: z.enum(['1.25', '1.5', '1.75', '2']).optional(),
    sidebarWidth: z.number().min(200).max(400).optional(),
    borderRadius: z.enum(['none', 'small', 'medium', 'large', 'full']).optional(),
    shadowStyle: z.enum(['none', 'light', 'medium', 'strong']).optional(),
    compactMode: z.boolean().optional(),
}).strict();

/**
 * Security settings: max 20 keys, primitive values only (JSON Bomb prevention)
 */
export const securitySettingsSchema = z
    .record(
        z.string().max(64),
        z.union([z.string().max(256), z.number().finite(), z.boolean(), z.null()]),
    )
    .refine((val) => Object.keys(val).length <= 20, {
        message: "Güvenlik ayarları maksimum 20 anahtar içerebilir",
    });

export const settingsPatchSchema = z.object({
    tenant: z.object({
        name: z.string().min(1).max(100).optional(),
        plan: z.string().min(1).max(50).optional(),
    }).strict().optional(),
    site: z.object({
        id: z.string().uuid(),
        settings: z.record(z.string(), z.unknown()).optional(),
    }).strict().optional(),
    security: securitySettingsSchema.optional(),
    backup: backupSettingsSchema.optional(),
    i18n: i18nSettingsSchema.optional(),
    theme: themeSettingsSchema.optional(),
}).strict();

export type SettingsPatch = z.infer<typeof settingsPatchSchema>;
export type BackupSettings = z.infer<typeof backupSettingsSchema>;
export type I18nSettings = z.infer<typeof i18nSettingsSchema>;
export type ThemeSettings = z.infer<typeof themeSettingsSchema>;
