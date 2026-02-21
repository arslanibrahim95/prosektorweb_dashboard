import { describe, expect, it } from "vitest";
import { HttpError, parseJson } from "../../src/server/api/http";

function bytes(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

describe("parseJson", () => {
  it("parses valid JSON under byte limit", async () => {
    const body = JSON.stringify({ ok: true, value: 42 });
    const req = new Request("http://localhost/api/test", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body,
    });

    await expect(parseJson(req, { maxBytes: 1024 })).resolves.toEqual({
      ok: true,
      value: 42,
    });
  });

  it("returns 413 when content-length exceeds maxBytes", async () => {
    const body = JSON.stringify({ payload: "x".repeat(32) });
    const req = new Request("http://localhost/api/test", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "content-length": String(bytes(body)),
      },
      body,
    });

    try {
      await parseJson(req, { maxBytes: 8 });
      throw new Error("expected parseJson to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(HttpError);
      const httpError = error as HttpError;
      expect(httpError.status).toBe(413);
      expect(httpError.body.code).toBe("VALIDATION_ERROR");
    }
  });

  it("returns 413 when raw body bytes exceed maxBytes", async () => {
    const body = JSON.stringify({ payload: "x".repeat(32) });
    const req = new Request("http://localhost/api/test", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        // Keep header small so runtime byte check is exercised.
        "content-length": "1",
      },
      body,
    });

    try {
      await parseJson(req, { maxBytes: 8 });
      throw new Error("expected parseJson to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(HttpError);
      const httpError = error as HttpError;
      expect(httpError.status).toBe(413);
    }
  });

  it("returns 400 for invalid JSON", async () => {
    const req = new Request("http://localhost/api/test", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: "{invalid json",
    });

    try {
      await parseJson(req, { maxBytes: 1024 });
      throw new Error("expected parseJson to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(HttpError);
      const httpError = error as HttpError;
      expect(httpError.status).toBe(400);
      expect(httpError.body.code).toBe("VALIDATION_ERROR");
    }
  });
});
