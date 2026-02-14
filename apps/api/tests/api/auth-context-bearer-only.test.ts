import { describe, expect, it } from "vitest";
import { requireAuthContext } from "../../src/server/auth/context";

describe("requireAuthContext bearer-only", () => {
  it("rejects requests without Authorization bearer token", async () => {
    await expect(requireAuthContext(new Request("http://localhost/api/me"))).rejects.toMatchObject({
      status: 401,
      code: "UNAUTHORIZED",
    });
  });

  it("rejects malformed Authorization scheme", async () => {
    const req = new Request("http://localhost/api/me", {
      headers: {
        Authorization: "Basic abc123",
      },
    });

    await expect(requireAuthContext(req)).rejects.toMatchObject({
      status: 401,
      code: "UNAUTHORIZED",
    });
  });

  it("rejects oversized bearer tokens", async () => {
    const req = new Request("http://localhost/api/me", {
      headers: {
        Authorization: `Bearer ${"a".repeat(9000)}`,
      },
    });

    await expect(requireAuthContext(req)).rejects.toMatchObject({
      status: 401,
      code: "UNAUTHORIZED",
    });
  });
});
