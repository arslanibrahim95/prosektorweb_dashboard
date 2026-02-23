import { describe, it, expect, vi } from "vitest";
import {
    createError,
    createValidationError,
    createAuthError,
    createNotFoundError,
    createConflictError,
    createInternalError,
    createRateLimitError,
    getErrorStatus,
    isClientSafeError,
} from "../../src/server/errors/error-service";

// Mock logger to prevent console output during tests
vi.mock("@/lib/logger", () => ({
    logger: {
        error: vi.fn(),
    },
}));

describe("error-service", () => {
    describe("createError", () => {
        it("should create error with correct status code for VALIDATION_ERROR", () => {
            const error = createError({ code: "VALIDATION_ERROR" });
            expect(error.status).toBe(400);
            expect(error.body.code).toBe("VALIDATION_ERROR");
        });

        it("should create error with correct status code for UNAUTHORIZED", () => {
            const error = createError({ code: "UNAUTHORIZED" });
            expect(error.status).toBe(401);
            expect(error.body.code).toBe("UNAUTHORIZED");
        });

        it("should create error with correct status code for FORBIDDEN", () => {
            const error = createError({ code: "FORBIDDEN" });
            expect(error.status).toBe(403);
            expect(error.body.code).toBe("FORBIDDEN");
        });

        it("should create error with correct status code for NOT_FOUND", () => {
            const error = createError({ code: "NOT_FOUND" });
            expect(error.status).toBe(404);
            expect(error.body.code).toBe("NOT_FOUND");
        });

        it("should create error with correct status code for CONFLICT", () => {
            const error = createError({ code: "CONFLICT" });
            expect(error.status).toBe(409);
            expect(error.body.code).toBe("CONFLICT");
        });

        it("should create error with correct status code for RATE_LIMITED", () => {
            const error = createError({ code: "RATE_LIMITED" });
            expect(error.status).toBe(429);
            expect(error.body.code).toBe("RATE_LIMITED");
        });

        it("should create error with correct status code for INTERNAL_ERROR", () => {
            const error = createError({ code: "INTERNAL_ERROR" });
            expect(error.status).toBe(500);
            expect(error.body.code).toBe("INTERNAL_ERROR");
        });

        it("should use custom message when provided", () => {
            const customMessage = "Custom error message";
            const error = createError({ code: "VALIDATION_ERROR", message: customMessage });
            expect(error.body.message).toBe(customMessage);
        });

        it("should include details when provided", () => {
            const details = { email: ["Invalid email format"] };
            const error = createError({ code: "VALIDATION_ERROR", details });
            expect(error.body.details).toEqual(details);
        });

        it("should sanitize password in error message", () => {
            const error = createError({ code: "INTERNAL_ERROR", message: "password=secret123" });
            expect(error.body.message).not.toBe("password=secret123");
        });

        it("should sanitize api_key in error message", () => {
            const error = createError({ code: "INTERNAL_ERROR", message: "api_key=abc123" });
            expect(error.body.message).not.toBe("api_key=abc123");
        });

        it("should sanitize access_token in error message", () => {
            const error = createError({ code: "INTERNAL_ERROR", message: "access_token=xyz" });
            expect(error.body.message).not.toBe("access_token=xyz");
        });

        it("should sanitize connection string in error message", () => {
            const error = createError({ code: "INTERNAL_ERROR", message: "postgresql://user:pass@localhost" });
            expect(error.body.message).not.toContain("pass@localhost");
        });

        it("should sanitize file paths in error message", () => {
            const error = createError({ code: "INTERNAL_ERROR", message: "Error at /var/log/app.log" });
            expect(error.body.message).not.toContain("/var/log");
        });

        it("should sanitize IP addresses in error message", () => {
            const error = createError({ code: "INTERNAL_ERROR", message: "Connecting to 192.168.1.1 failed" });
            expect(error.body.message).not.toContain("192.168.1.1");
        });

        it("should allow safe messages to pass through", () => {
            const safeMessage = "User not found";
            const error = createError({ code: "NOT_FOUND", message: safeMessage });
            expect(error.body.message).toBe(safeMessage);
        });
    });

    describe("createValidationError", () => {
        it("should create validation error with default message", () => {
            const error = createValidationError();
            expect(error.status).toBe(400);
            expect(error.body.code).toBe("VALIDATION_ERROR");
        });

        it("should create validation error with custom message", () => {
            const error = createValidationError("Custom validation failed");
            expect(error.body.message).toBe("Custom validation failed");
        });

        it("should create validation error with details", () => {
            const details = { field: ["Required"] };
            const error = createValidationError("Validation failed", details);
            expect(error.body.details).toEqual(details);
        });
    });

    describe("createAuthError", () => {
        it("should create UNAUTHORIZED error", () => {
            const error = createAuthError("UNAUTHORIZED");
            expect(error.status).toBe(401);
            expect(error.body.code).toBe("UNAUTHORIZED");
        });

        it("should create FORBIDDEN error", () => {
            const error = createAuthError("FORBIDDEN");
            expect(error.status).toBe(403);
            expect(error.body.code).toBe("FORBIDDEN");
        });

        it("should create NO_TENANT error", () => {
            const error = createAuthError("NO_TENANT");
            expect(error.status).toBe(403);
            expect(error.body.code).toBe("NO_TENANT");
        });

        it("should allow custom message", () => {
            const error = createAuthError("UNAUTHORIZED", "Custom auth message");
            expect(error.body.message).toBe("Custom auth message");
        });
    });

    describe("createNotFoundError", () => {
        it("should create NOT_FOUND error with default message", () => {
            const error = createNotFoundError();
            expect(error.status).toBe(404);
            expect(error.body.code).toBe("NOT_FOUND");
            expect(error.body.message).toBe("Kaynak bulunamadı.");
        });

        it("should create NOT_FOUND error with resource name", () => {
            const error = createNotFoundError("Kullanıcı");
            expect(error.body.message).toBe("Kullanıcı bulunamadı.");
        });

        it("should allow custom message", () => {
            const error = createNotFoundError("Kullanıcı", "Custom not found message");
            expect(error.body.message).toBe("Custom not found message");
        });
    });

    describe("createConflictError", () => {
        it("should create CONFLICT error with default message", () => {
            const error = createConflictError();
            expect(error.status).toBe(409);
            expect(error.body.code).toBe("CONFLICT");
        });

        it("should allow custom message", () => {
            const error = createConflictError("Custom conflict message");
            expect(error.body.message).toBe("Custom conflict message");
        });

        it("should include details when provided", () => {
            const details = { slug: ["Already exists"] };
            const error = createConflictError("Conflict", details);
            expect(error.body.details).toEqual(details);
        });
    });

    describe("createInternalError", () => {
        it("should create INTERNAL_ERROR with default message", () => {
            const error = createInternalError();
            expect(error.status).toBe(500);
            expect(error.body.code).toBe("INTERNAL_ERROR");
        });

        it("should allow custom message", () => {
            const error = createInternalError("Custom internal error");
            expect(error.body.message).toBe("Custom internal error");
        });

        it("should accept originalError for logging", () => {
            const originalError = new Error("Original error");
            const error = createInternalError("Error occurred", originalError);
            expect(error.body.code).toBe("INTERNAL_ERROR");
        });
    });

    describe("createRateLimitError", () => {
        it("should create RATE_LIMITED error with default message", () => {
            const error = createRateLimitError();
            expect(error.status).toBe(429);
            expect(error.body.code).toBe("RATE_LIMITED");
        });

        it("should allow custom message", () => {
            const error = createRateLimitError("Too many requests");
            expect(error.body.message).toBe("Too many requests");
        });
    });

    describe("getErrorStatus", () => {
        it("should return correct status for VALIDATION_ERROR", () => {
            expect(getErrorStatus("VALIDATION_ERROR")).toBe(400);
        });

        it("should return correct status for UNAUTHORIZED", () => {
            expect(getErrorStatus("UNAUTHORIZED")).toBe(401);
        });

        it("should return correct status for FORBIDDEN", () => {
            expect(getErrorStatus("FORBIDDEN")).toBe(403);
        });

        it("should return correct status for NOT_FOUND", () => {
            expect(getErrorStatus("NOT_FOUND")).toBe(404);
        });

        it("should return correct status for CONFLICT", () => {
            expect(getErrorStatus("CONFLICT")).toBe(409);
        });

        it("should return correct status for RATE_LIMITED", () => {
            expect(getErrorStatus("RATE_LIMITED")).toBe(429);
        });

        it("should return 500 for unknown error code", () => {
            expect(getErrorStatus("UNKNOWN_CODE" as Parameters<typeof getErrorStatus>[0])).toBe(500);
        });
    });

    describe("isClientSafeError", () => {
        it("should return true for VALIDATION_ERROR", () => {
            expect(isClientSafeError("VALIDATION_ERROR")).toBe(true);
        });

        it("should return true for UNAUTHORIZED", () => {
            expect(isClientSafeError("UNAUTHORIZED")).toBe(true);
        });

        it("should return true for FORBIDDEN", () => {
            expect(isClientSafeError("FORBIDDEN")).toBe(true);
        });

        it("should return true for NOT_FOUND", () => {
            expect(isClientSafeError("NOT_FOUND")).toBe(true);
        });

        it("should return false for INTERNAL_ERROR", () => {
            expect(isClientSafeError("INTERNAL_ERROR")).toBe(false);
        });

        it("should return false for DATABASE_ERROR", () => {
            expect(isClientSafeError("DATABASE_ERROR")).toBe(false);
        });

        it("should return false for UPLOAD_FAILED", () => {
            expect(isClientSafeError("UPLOAD_FAILED")).toBe(false);
        });

        it("should return false for EXTERNAL_SERVICE_ERROR", () => {
            expect(isClientSafeError("EXTERNAL_SERVICE_ERROR")).toBe(false);
        });
    });
});
