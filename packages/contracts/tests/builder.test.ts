import { describe, expect, it } from "vitest";
import {
  createBuilderComponentRequestSchema,
  listBuilderComponentsQuerySchema,
  publishBuilderLayoutResponseSchema,
  updateBuilderLayoutRequestSchema,
} from "../builder";

describe("builder contracts", () => {
  it("accepts valid list query", () => {
    const parsed = listBuilderComponentsQuerySchema.safeParse({
      category: "hero",
      search: "landing",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects invalid category in query", () => {
    const parsed = listBuilderComponentsQuerySchema.safeParse({
      category: "invalid",
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts valid create payload", () => {
    const parsed = createBuilderComponentRequestSchema.safeParse({
      name: "Hero Variant A",
      category: "hero",
      component_type: "hero_banner",
      schema: { headline: { type: "string" } },
      default_props: { headline: "Hello" },
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects payload with missing required fields", () => {
    const parsed = createBuilderComponentRequestSchema.safeParse({
      name: "Broken",
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts valid builder layout update payload", () => {
    const parsed = updateBuilderLayoutRequestSchema.safeParse({
      layout_data: { hero: { title: "Hello" } },
      preview_data: { mobile: true },
    });
    expect(parsed.success).toBe(true);
  });

  it("accepts valid publish response payload", () => {
    const parsed = publishBuilderLayoutResponseSchema.safeParse({
      success: true,
      revision_id: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(parsed.success).toBe(true);
  });
});
