import { describe, it, expect } from "vitest";
import { z } from "zod";
import { zodErrorToDetails } from "../../src/server/api/http";

describe("zodErrorToDetails", () => {
  it("maps Zod issues to {field:[messages]}", () => {
    const schema = z.object({
      email: z.string().email(),
      nested: z.object({
        name: z.string().min(2),
      }),
    });

    const parsed = schema.safeParse({ email: "not-email", nested: { name: "A" } });
    expect(parsed.success).toBe(false);
    if (parsed.success) return;

    const details = zodErrorToDetails(parsed.error);
    expect(details.email?.length).toBeGreaterThan(0);
    expect(details["nested.name"]?.length).toBeGreaterThan(0);
  });
});

