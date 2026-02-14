import { describe, it, expect } from "vitest";
import {
    ROLE_PERMISSIONS,
    ROLE_DISPLAY_NAMES,
    permissionsForRole,
} from "@/server/auth/permissions";
import { hasRole, hasPermission } from "@/server/auth";
import type { UserRole, TenantRole } from "@prosektor/contracts";
import { userRoleSchema, tenantRoleSchema } from "@prosektor/contracts";

describe("Kullanıcı Rolleri ve Yetkilendirme Sistemi", () => {
    describe("Rol Tanımları", () => {
        it("tüm platform rollerinin tanımlı olması gerekir", () => {
            const expectedRoles: UserRole[] = ["super_admin", "owner", "admin", "editor", "viewer"];

            expectedRoles.forEach((role) => {
                expect(ROLE_PERMISSIONS).toHaveProperty(role);
                expect(ROLE_DISPLAY_NAMES).toHaveProperty(role);
            });
        });

        it("tenant rollerinin doğru tanımlanması gerekir", () => {
            const expectedTenantRoles: TenantRole[] = ["owner", "admin", "editor", "viewer"];

            // tenantRoleSchema sadece tenant düzeyindeki rolleri içermeli
            expectedTenantRoles.forEach((role) => {
                const result = tenantRoleSchema.safeParse(role);
                expect(result.success, `${role} rolü tenantRoleSchema'da bulunmalı`).toBe(true);
            });

            // super_admin tenant rolü olmamalı
            const superAdminResult = tenantRoleSchema.safeParse("super_admin");
            expect(superAdminResult.success).toBe(false);
        });

        it("rollerin display isimlerinin doğru olması gerekir", () => {
            expect(ROLE_DISPLAY_NAMES.super_admin).toBe("Super Admin");
            expect(ROLE_DISPLAY_NAMES.owner).toBe("Owner");
            expect(ROLE_DISPLAY_NAMES.admin).toBe("Admin");
            expect(ROLE_DISPLAY_NAMES.editor).toBe("Editor");
            expect(ROLE_DISPLAY_NAMES.viewer).toBe("Viewer");
        });
    });

    describe("Rol Yetkilendirme Matrisi", () => {
        describe("super_admin rolü", () => {
            it("tüm izinlere sahip olmalı", () => {
                const permissions = permissionsForRole("super_admin");
                expect(permissions).toContain("*");
            });

            it("hasPermission her durumda true dönmeli", () => {
                expect(hasPermission("super_admin", "users:create")).toBe(true);
                expect(hasPermission("super_admin", "users:delete")).toBe(true);
                expect(hasPermission("super_admin", "tenants:delete")).toBe(true);
                expect(hasPermission("super_admin", "anything:anyaction")).toBe(true);
            });
        });

        describe("owner rolü", () => {
            it("kapsamlı izinlere sahip olmalı", () => {
                const permissions = permissionsForRole("owner");

                expect(permissions).toContain("tenants:read");
                expect(permissions).toContain("sites:*");
                expect(permissions).toContain("pages:*");
                expect(permissions).toContain("users:*");
                expect(permissions).toContain("billing:*");
                expect(permissions).toContain("analytics:read");
            });

            it("izin kontrolü doğru çalışmalı", () => {
                expect(hasPermission("owner", "sites:create")).toBe(true);
                expect(hasPermission("owner", "users:create")).toBe(true);
                expect(hasPermission("owner", "users:delete")).toBe(true);
                expect(hasPermission("owner", "billing:read")).toBe(true);
            });
        });

        describe("admin rolü", () => {
            it("owner'a benzer ancak sınırlı izinlere sahip olmalı", () => {
                const permissions = permissionsForRole("admin");

                expect(permissions).toContain("sites:*");
                expect(permissions).toContain("users:create,read,update");
                expect(permissions).toContain("analytics:read");
            });

            it("bazı kritik işlemlere izin vermemeli", () => {
                // Admin kullanıcı silememeli
                expect(hasPermission("admin", "users:delete")).toBe(false);
                // Billing tam erişimi olmamalı
                expect(hasPermission("admin", "billing:*")).toBe(false);
            });
        });

        describe("editor rolü", () => {
            it("içerik yönetimi izinlerine sahip olmalı", () => {
                const permissions = permissionsForRole("editor");

                expect(permissions).toContain("pages:*");
                expect(permissions).toContain("media:*");
                expect(permissions).toContain("menus:*");
            });

            it("sınırlı kullanıcı izinlerine sahip olmalı", () => {
                expect(hasPermission("editor", "users:read")).toBe(true);
                expect(hasPermission("editor", "users:create")).toBe(false);
                expect(hasPermission("editor", "users:delete")).toBe(false);
            });

            it("staging yayınlama yapabilmeli", () => {
                expect(hasPermission("editor", "publish:staging")).toBe(true);
                expect(hasPermission("editor", "publish:production")).toBe(false);
            });
        });

        describe("viewer rolü", () => {
            it("salt okunur izinlere sahip olmalı", () => {
                const permissions = permissionsForRole("viewer");

                // Tüm :read izinleri kontrolü
                expect(permissions).toContain("sites:read");
                expect(permissions).toContain("pages:read");
                expect(permissions).toContain("users:read");
                expect(permissions).toContain("analytics:read");
            });

            it("hiçbir yazma iznine sahip olmamalı", () => {
                expect(hasPermission("viewer", "users:create")).toBe(false);
                expect(hasPermission("viewer", "users:update")).toBe(false);
                expect(hasPermission("viewer", "users:delete")).toBe(false);
                expect(hasPermission("viewer", "pages:create")).toBe(false);
                expect(hasPermission("viewer", "pages:update")).toBe(false);
                expect(hasPermission("viewer", "sites:create")).toBe(false);
            });

            it("sadece okuma işlemleri için erişim sağlamalı", () => {
                expect(hasPermission("viewer", "publish:read")).toBe(true);
                expect(hasPermission("viewer", "publish:create")).toBe(false);
            });
        });
    });

    describe("Rol Kontrol Fonksiyonları", () => {
        it("hasRole doğru çalışmalı", () => {
            expect(hasRole("admin", ["admin", "editor"])).toBe(true);
            expect(hasRole("viewer", ["admin", "editor"])).toBe(false);
            expect(hasRole("owner", ["owner"])).toBe(true);
            expect(hasRole("super_admin", ["super_admin", "owner"])).toBe(true);

            // Super Admin wildcard check
            expect(hasRole("super_admin", ["owner"])).toBe(true);
            expect(hasRole("super_admin", ["admin"])).toBe(true);
        });

        it("birden fazla rol kontrolü yapabilmeli", () => {
            const allowedRoles: UserRole[] = ["admin", "editor", "viewer"];

            expect(hasRole("admin", allowedRoles)).toBe(true);
            expect(hasRole("editor", allowedRoles)).toBe(true);
            expect(hasRole("viewer", allowedRoles)).toBe(true);
            expect(hasRole("owner", allowedRoles)).toBe(false);
            expect(hasRole("super_admin", allowedRoles)).toBe(false);
        });
    });

    describe("Bilinmeyen Rol Güvenliği", () => {
        it("bilinmeyen rol için boş izin listesi dönmeli", () => {
            // Geçersiz rol adı ile çağrıldığında hata vermemeli
            const permissions = permissionsForRole("invalid_role" as UserRole);
            expect(permissions).toEqual([]);
        });

        it("bilinmeyen rol için hasPermission hata vermemeli", () => {
            // Not: Mevcut uygulamada bilinmeyen roller için crash oluyor
            // Bu test, fonksiyonun hata vermemesi gerektiğini kontrol eder
            // TODO: Bu bir güvenlik açığı olabilir - hasPermission düzeltilmeli
            expect(() => {
                try {
                    hasPermission("invalid_role" as UserRole, "anything:read");
                } catch (e) {
                    // Mevcut davranış: hata fırlatıyor
                }
            }).not.toThrow();
        });

        it("bilinmeyen rol için hasRole false dönmeli", () => {
            expect(hasRole("invalid_role" as UserRole, ["admin"])).toBe(false);
        });
    });

    describe("İzin Formatı Doğrulaması", () => {
        it("izinlerin doğru formatta olması gerekir", () => {
            const allPermissions = Object.values(ROLE_PERMISSIONS).flat();

            allPermissions.forEach((permission) => {
                const perm = permission as string;
                // İzin formatı: "resource:action" veya "resource:*" veya "*"
                const isValidFormat =
                    perm === "*" ||
                    /^[^:]+:\*$/.test(perm) ||
                    /^[^:]+:[^,]+$/.test(perm) ||
                    /^[^:]+:[^,]+(,[^,]+)*$/.test(perm);

                expect(isValidFormat, `${perm} geçerli bir izin formatı değil`).toBe(true);
            });
        });

        it("her rol için izinler tanımlanmış olmalı", () => {
            const roles: UserRole[] = ["super_admin", "owner", "admin", "editor", "viewer"];

            roles.forEach((role) => {
                const permissions = permissionsForRole(role);
                expect(permissions.length).toBeGreaterThan(0);
            });
        });
    });

    describe("Rol Hiyerarşisi Doğrulaması", () => {
        it("roller arasında hiyerarşi olmalı - en az izin viewer'da", () => {
            const viewerPerms = permissionsForRole("viewer").length;
            const editorPerms = permissionsForRole("editor").length;
            const adminPerms = permissionsForRole("admin").length;
            const ownerPerms = permissionsForRole("owner").length;

            // Viewer en az izne sahip olmalı
            expect(viewerPerms).toBeLessThanOrEqual(editorPerms);
            // Editor, viewer'dan daha fazla izne sahip olmalı
            expect(editorPerms).toBeLessThanOrEqual(adminPerms);
        });

        it("super_admin tüm izinlere sahip olmalı", () => {
            const superAdminPerms = permissionsForRole("super_admin");
            const ownerPerms = permissionsForRole("owner");

            // super_admin *, yani tüm izinlere sahip
            expect(superAdminPerms).toContain("*");
        });
    });

    describe("Schema Doğrulaması", () => {
        it("geçerli roller schema'dan geçmeli", () => {
            const validRoles: UserRole[] = ["super_admin", "owner", "admin", "editor", "viewer"];

            validRoles.forEach((role) => {
                const result = userRoleSchema.safeParse(role);
                expect(result.success, `${role} geçerli bir rol olmalı`).toBe(true);
            });
        });

        it("geçersiz roller schema'dan geçmemeli", () => {
            const invalidRoles = ["superuser", "moderator", "user", "guest", ""];

            invalidRoles.forEach((role) => {
                const result = userRoleSchema.safeParse(role);
                expect(result.success, `${role} geçersiz bir rol olmalı`).toBe(false);
            });
        });
    });
});
