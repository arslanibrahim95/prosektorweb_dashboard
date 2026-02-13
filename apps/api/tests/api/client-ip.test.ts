import { describe, expect, it } from "vitest";
import { getClientIp } from "../../src/server/rate-limit";

describe("getClientIp", () => {
  it("prefers x-real-ip over forwarded headers", () => {
    const req = new Request("http://localhost", {
      headers: {
        "x-real-ip": "10.0.0.9",
        "x-forwarded-for": "1.1.1.1, 2.2.2.2",
      },
    });

    expect(getClientIp(req)).toBe("10.0.0.9");
  });

  it("uses the last x-forwarded-for entry when x-real-ip is missing", () => {
    const req = new Request("http://localhost", {
      headers: {
        "x-forwarded-for": "1.1.1.1, 2.2.2.2",
      },
    });

    expect(getClientIp(req)).toBe("2.2.2.2");
  });

  it("falls back to 0.0.0.0 when no headers are provided", () => {
    const req = new Request("http://localhost");
    expect(getClientIp(req)).toBe("0.0.0.0");
  });
});
