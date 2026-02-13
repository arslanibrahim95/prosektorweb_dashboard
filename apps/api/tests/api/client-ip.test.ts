import { describe, expect, it } from "vitest";
import { getClientIp } from "../../src/server/rate-limit";

describe("getClientIp", () => {
  it("prefers cf-connecting-ip over forwarded headers", () => {
    const req = new Request("http://localhost", {
      headers: {
        "cf-connecting-ip": "10.0.0.9",
        "x-forwarded-for": "1.1.1.1, 2.2.2.2, 3.3.3.3",
      },
    });

    expect(getClientIp(req)).toBe("10.0.0.9");
  });

  it("uses the first x-forwarded-for entry when cf-connecting-ip is missing", () => {
    const req = new Request("http://localhost", {
      headers: {
        "x-forwarded-for": "1.1.1.1, 2.2.2.2",
      },
    });

    expect(getClientIp(req)).toBe("1.1.1.1");
  });

  it("ignores invalid forwarded values and falls back to next valid candidate", () => {
    const req = new Request("http://localhost", {
      headers: {
        "x-forwarded-for": "unknown, 2.2.2.2",
      },
    });

    expect(getClientIp(req)).toBe("2.2.2.2");
  });

  it("ignores x-real-ip as untrusted source", () => {
    const req = new Request("http://localhost", {
      headers: {
        "x-real-ip": "9.9.9.9",
      },
    });

    expect(getClientIp(req)).toBe("0.0.0.0");
  });

  it("falls back to 0.0.0.0 when no headers are provided", () => {
    const req = new Request("http://localhost");
    expect(getClientIp(req)).toBe("0.0.0.0");
  });
});
