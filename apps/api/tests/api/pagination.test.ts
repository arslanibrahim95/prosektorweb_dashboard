import { describe, it, expect } from "vitest";
import { calculatePaginationRange } from "@/server/api/pagination";

describe("calculatePaginationRange", () => {
    it("should calculate correct range for first page", () => {
        const result = calculatePaginationRange(1, 50);
        expect(result).toEqual({ from: 0, to: 49 });
    });

    it("should calculate correct range for second page", () => {
        const result = calculatePaginationRange(2, 50);
        expect(result).toEqual({ from: 50, to: 99 });
    });

    it("should calculate correct range for third page", () => {
        const result = calculatePaginationRange(3, 50);
        expect(result).toEqual({ from: 100, to: 149 });
    });

    it("should handle different page sizes", () => {
        const result = calculatePaginationRange(1, 10);
        expect(result).toEqual({ from: 0, to: 9 });
    });

    it("should handle page size of 1", () => {
        const result = calculatePaginationRange(5, 1);
        expect(result).toEqual({ from: 4, to: 4 });
    });

    it("should handle large page numbers", () => {
        const result = calculatePaginationRange(100, 50);
        expect(result).toEqual({ from: 4950, to: 4999 });
    });

    it("should handle maximum allowed limit (100)", () => {
        const result = calculatePaginationRange(1, 100);
        expect(result).toEqual({ from: 0, to: 99 });
    });

    it("should calculate correct range for page 2 with limit 100", () => {
        const result = calculatePaginationRange(2, 100);
        expect(result).toEqual({ from: 100, to: 199 });
    });
});
