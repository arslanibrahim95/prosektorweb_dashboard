import { describe, it, expect } from "vitest";
import {
    assertAdminRole,
    assertOwnerRole,
    assertSuperAdminRole,
} from "@/server/admin/access";

describe("admin/access — role assertion guards", () => {
    describe("assertAdminRole", () => {
        it("does NOT throw for admin role", () => {
            expect(() => assertAdminRole("admin")).not.toThrow();
        });

        it("does NOT throw for owner role", () => {
            expect(() => assertAdminRole("owner")).not.toThrow();
        });

        it("does NOT throw for super_admin role", () => {
            expect(() => assertAdminRole("super_admin")).not.toThrow();
        });

        it("throws for editor role", () => {
            expect(() => assertAdminRole("editor")).toThrow();
        });

        it("throws for viewer role", () => {
            expect(() => assertAdminRole("viewer")).toThrow();
        });

        it("throws with custom message", () => {
            expect(() => assertAdminRole("viewer", "Custom error msg")).toThrow("Custom error msg");
        });

        it("throws with 403 status code", () => {
            try {
                assertAdminRole("editor");
            } catch (e: unknown) {
                const err = e as { status?: number };
                expect(err.status).toBe(403);
            }
        });
    });

    describe("assertOwnerRole", () => {
        it("does NOT throw for owner role", () => {
            expect(() => assertOwnerRole("owner")).not.toThrow();
        });

        it("does NOT throw for super_admin role", () => {
            expect(() => assertOwnerRole("super_admin")).not.toThrow();
        });

        it("throws for admin role", () => {
            expect(() => assertOwnerRole("admin")).toThrow();
        });

        it("throws for editor role", () => {
            expect(() => assertOwnerRole("editor")).toThrow();
        });

        it("throws for viewer role", () => {
            expect(() => assertOwnerRole("viewer")).toThrow();
        });
    });

    describe("assertSuperAdminRole", () => {
        it("does NOT throw for super_admin role", () => {
            expect(() => assertSuperAdminRole("super_admin")).not.toThrow();
        });

        it("throws for owner role", () => {
            expect(() => assertSuperAdminRole("owner")).toThrow();
        });

        it("throws for admin role", () => {
            expect(() => assertSuperAdminRole("admin")).toThrow();
        });

        it("throws for editor role", () => {
            expect(() => assertSuperAdminRole("editor")).toThrow();
        });

        it("throws for viewer role", () => {
            expect(() => assertSuperAdminRole("viewer")).toThrow();
        });
    });
});
