import { describe, it, expect } from "vitest";
import { escapeSearchTerm } from "@/server/api/search";

describe("escapeSearchTerm", () => {
    it("should return unchanged string without special characters", () => {
        const result = escapeSearchTerm("john doe");
        expect(result).toBe("john doe");
    });

    it("should escape backslashes", () => {
        const result = escapeSearchTerm("test\\value");
        expect(result).toBe("test\\\\value");
    });

    it("should escape percent signs", () => {
        const result = escapeSearchTerm("50% discount");
        expect(result).toBe("50\\% discount");
    });

    it("should escape underscores", () => {
        const result = escapeSearchTerm("user_name");
        expect(result).toBe("user\\_name");
    });

    it("should escape multiple special characters", () => {
        const result = escapeSearchTerm("test_%value\\");
        expect(result).toBe("test\\_\\%value\\\\");
    });

    it("should handle email addresses with special characters", () => {
        const result = escapeSearchTerm("user_test@example.com");
        expect(result).toBe("user\\_test@example.com");
    });

    it("should handle strings with only special characters", () => {
        const result = escapeSearchTerm("_%\\");
        expect(result).toBe("\\_\\%\\\\");
    });

    it("should handle empty string", () => {
        const result = escapeSearchTerm("");
        expect(result).toBe("");
    });

    it("should handle strings with multiple consecutive special characters", () => {
        const result = escapeSearchTerm("test___value");
        expect(result).toBe("test\\_\\_\\_value");
    });

    it("should preserve other characters like @, ., +, -", () => {
        const result = escapeSearchTerm("user@test.com+extra-info");
        expect(result).toBe("user@test.com+extra-info");
    });

    it("should escape backslash before other special characters", () => {
        const result = escapeSearchTerm("\\%test\\_");
        expect(result).toBe("\\\\\\%test\\\\\\_");
    });

    it("should handle unicode characters", () => {
        const result = escapeSearchTerm("Müller_test");
        expect(result).toBe("Müller\\_test");
    });
});
