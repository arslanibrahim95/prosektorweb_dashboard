import { describe, it, expect } from "vitest";
import { canAssignRole, safeUserName } from "@/server/admin/utils";

describe("admin/utils — canAssignRole", () => {
    describe("privilege escalation prevention", () => {
        it("admin cannot assign admin role", () => {
            expect(canAssignRole("admin", "admin")).toBe(false);
        });

        it("admin cannot assign owner role", () => {
            expect(canAssignRole("admin", "owner")).toBe(false);
        });

        it("admin cannot assign super_admin role", () => {
            expect(canAssignRole("admin", "super_admin")).toBe(false);
        });

        it("admin CAN assign editor role (below own level)", () => {
            expect(canAssignRole("admin", "editor")).toBe(true);
        });

        it("admin CAN assign viewer role (below own level)", () => {
            expect(canAssignRole("admin", "viewer")).toBe(true);
        });

        it("editor cannot assign editor role (same level)", () => {
            expect(canAssignRole("editor", "editor")).toBe(false);
        });

        it("editor cannot assign admin role (above level)", () => {
            expect(canAssignRole("editor", "admin")).toBe(false);
        });

        it("editor CAN assign viewer role (below level)", () => {
            expect(canAssignRole("editor", "viewer")).toBe(true);
        });

        it("viewer cannot assign any role", () => {
            expect(canAssignRole("viewer", "viewer")).toBe(false);
            expect(canAssignRole("viewer", "editor")).toBe(false);
            expect(canAssignRole("viewer", "admin")).toBe(false);
        });
    });

    describe("owner and super_admin privileges", () => {
        it("owner CAN assign any role", () => {
            expect(canAssignRole("owner", "viewer")).toBe(true);
            expect(canAssignRole("owner", "editor")).toBe(true);
            expect(canAssignRole("owner", "admin")).toBe(true);
            expect(canAssignRole("owner", "owner")).toBe(true);
            expect(canAssignRole("owner", "super_admin")).toBe(true);
        });

        it("super_admin CAN assign any role", () => {
            expect(canAssignRole("super_admin", "viewer")).toBe(true);
            expect(canAssignRole("super_admin", "editor")).toBe(true);
            expect(canAssignRole("super_admin", "admin")).toBe(true);
            expect(canAssignRole("super_admin", "owner")).toBe(true);
            expect(canAssignRole("super_admin", "super_admin")).toBe(true);
        });
    });

    describe("unknown role handling", () => {
        it("unknown actor role cannot assign any role", () => {
            expect(canAssignRole("unknown_role", "viewer")).toBe(false);
            expect(canAssignRole("unknown_role", "admin")).toBe(false);
        });

        it("any role cannot assign unknown target role (treated as level 0)", () => {
            // Unknown target has level 0, so admin (level 3) can assign it
            expect(canAssignRole("admin", "unknown_role")).toBe(true);
        });
    });
});

describe("admin/utils — safeUserName", () => {
    it("returns name from metadata when available", () => {
        expect(safeUserName("user@example.com", { name: "John Doe" })).toBe("John Doe");
    });

    it("falls back to email when name is empty", () => {
        expect(safeUserName("user@example.com", { name: "" })).toBe("user@example.com");
    });

    it("falls back to email when name is whitespace only", () => {
        expect(safeUserName("user@example.com", { name: "   " })).toBe("user@example.com");
    });

    it("falls back to email when no metadata", () => {
        expect(safeUserName("user@example.com", null)).toBe("user@example.com");
    });

    it("falls back to email when metadata has no name", () => {
        expect(safeUserName("user@example.com", {})).toBe("user@example.com");
    });

    it("returns undefined when both email and name are missing", () => {
        expect(safeUserName(undefined, null)).toBeUndefined();
    });

    it("trims whitespace from name", () => {
        expect(safeUserName("user@example.com", { name: "  John  " })).toBe("John");
    });
});
