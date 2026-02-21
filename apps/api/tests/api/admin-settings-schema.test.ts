import { describe, it, expect } from "vitest";
import { settingsPatchSchema } from "@/schemas/admin-settings";

describe("admin settings PATCH schema", () => {
    describe("tenant fields", () => {
        it("accepts valid tenant name", () => {
            const result = settingsPatchSchema.safeParse({
                tenant: { name: "My Workspace" },
            });
            expect(result.success).toBe(true);
        });

        it("accepts valid tenant plan", () => {
            const result = settingsPatchSchema.safeParse({
                tenant: { plan: "pro" },
            });
            expect(result.success).toBe(true);
        });
    });

    describe("backup fields", () => {
        it("accepts valid backup settings", () => {
            const result = settingsPatchSchema.safeParse({
                backup: {
                    auto_backup: true,
                    frequency: "daily",
                    retention_period: "30",
                    location: "local",
                    include: { database: true, media: false },
                },
            });
            expect(result.success).toBe(true);
        });

        it("rejects invalid frequency", () => {
            const result = settingsPatchSchema.safeParse({
                backup: { frequency: "yearly" },
            });
            expect(result.success).toBe(false);
        });
    });

    describe("i18n fields", () => {
        it("accepts valid i18n settings", () => {
            const result = settingsPatchSchema.safeParse({
                i18n: {
                    defaultLanguage: "tr",
                    enabledLanguages: ["tr", "en"],
                    languages: [
                        {
                            id: "1",
                            name: "Turkish",
                            code: "tr",
                            status: "active",
                            isDefault: true,
                            progress: 100,
                        },
                    ],
                },
            });
            expect(result.success).toBe(true);
        });
    });

    describe("theme fields", () => {
        it("accepts valid theme settings", () => {
            const result = settingsPatchSchema.safeParse({
                theme: {
                    colors: { primary: "#ff0000" },
                    fontFamily: "inter",
                    baseFontSize: 16,
                },
            });
            expect(result.success).toBe(true);
        });

        it("rejects invalid color format", () => {
            const result = settingsPatchSchema.safeParse({
                theme: { colors: { primary: "red" } },
            });
            expect(result.success).toBe(false);
        });
    });

    describe("strict mode — check with combined fields", () => {
        it("accepts tenant + backup + theme in one request", () => {
            const result = settingsPatchSchema.safeParse({
                tenant: { name: "Updated Corp" },
                backup: { auto_backup: true },
                theme: { compactMode: true },
            });
            expect(result.success).toBe(true);
        });
    });

    describe("enhanced validations", () => {
        it("rejects non-integer baseFontSize", () => {
            const result = settingsPatchSchema.safeParse({
                theme: { baseFontSize: 16.5 },
            });
            expect(result.success).toBe(false);
        });

        it("accepts 3-char hex color", () => {
            const result = settingsPatchSchema.safeParse({
                theme: { colors: { primary: "#fff" } },
            });
            expect(result.success).toBe(true);
        });

        it("accepts rgb() color", () => {
            const result = settingsPatchSchema.safeParse({
                theme: { colors: { primary: "rgb(255, 0, 0)" } },
            });
            expect(result.success).toBe(true);
        });

        it("accepts rgba() color", () => {
            const result = settingsPatchSchema.safeParse({
                theme: { colors: { primary: "rgba(255, 0, 0, 0.5)" } },
            });
            expect(result.success).toBe(true);
        });

        it("rejects duplicate language codes", () => {
            const result = settingsPatchSchema.safeParse({
                i18n: {
                    languages: [
                        { id: "1", name: "Turkish", code: "tr", status: "active", isDefault: true, progress: 100 },
                        { id: "2", name: "Turkish2", code: "tr", status: "inactive", isDefault: false, progress: 50 },
                    ],
                },
            });
            expect(result.success).toBe(false);
        });

        it("rejects duplicate language codes case-insensitively", () => {
            const result = settingsPatchSchema.safeParse({
                i18n: {
                    languages: [
                        { id: "1", name: "Turkish", code: "tr", status: "active", isDefault: true, progress: 100 },
                        { id: "2", name: "Turkish2", code: "TR", status: "inactive", isDefault: false, progress: 50 },
                    ],
                },
            });
            expect(result.success).toBe(false);
        });

        it("rejects security payload with too many keys", () => {
            const tooManyKeys = Object.fromEntries(
                Array.from({ length: 21 }, (_, i) => [`key${i}`, "value"])
            );
            const result = settingsPatchSchema.safeParse({ security: tooManyKeys });
            expect(result.success).toBe(false);
        });

        it("rejects security payload with nested object values", () => {
            const result = settingsPatchSchema.safeParse({
                security: { nested: { deep: "value" } },
            });
            expect(result.success).toBe(false);
        });

        it("rejects unknown root fields due to strict schema", () => {
            const result = settingsPatchSchema.safeParse({
                tenant: { name: "Valid" },
                unknownRootField: true,
            });
            expect(result.success).toBe(false);
        });

        it("rejects invalid rgb channel values", () => {
            const result = settingsPatchSchema.safeParse({
                theme: { colors: { primary: "rgb(999, 0, 0)" } },
            });
            expect(result.success).toBe(false);
        });
    });
});
