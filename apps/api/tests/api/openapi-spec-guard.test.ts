import { describe, expect, it } from "vitest";
import { openApiSpec } from "@/openapi/spec";

type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

describe("openapi spec guard", () => {
  it("maintains base metadata and server contract", () => {
    expect(openApiSpec.openapi).toBe("3.0.3");
    expect(openApiSpec.info.title).toBe("ProsektorWeb Dashboard API");
    expect(openApiSpec.info.version).toBe("1.0.0");
    expect(openApiSpec.servers?.[0]?.url).toBe("/api");
    expect(openApiSpec.servers?.[0]?.description).toBe("API Server");
  });

  it("exposes required security schemes, schemas, and responses", () => {
    const components = openApiSpec.components;

    expect(components.securitySchemes).toHaveProperty("bearerAuth.type", "http");
    expect(components.securitySchemes).toHaveProperty("bearerAuth.scheme", "bearer");

    ["ErrorResponse", "PaginatedResponse", "SuccessResponse"].forEach((schemaKey) => {
      expect(components.schemas, `missing schema ${schemaKey}`).toHaveProperty(schemaKey);
    });

    ["Success", "BadRequest", "Unauthorized", "Forbidden", "NotFound", "InternalError"].forEach(
      (responseKey) => {
        expect(components.responses, `missing response ${responseKey}`).toHaveProperty(
          responseKey,
        );
      },
    );
  });

  it("defines critical business paths with stable operations", () => {
    const criticalPaths: Array<{
      path: keyof typeof openApiSpec.paths;
      method: HttpMethod;
      secured: boolean;
      responses: string[];
    }> = [
      {
        path: "/auth/token",
        method: "post",
        secured: true,
        responses: ["200", "400", "401", "429", "500"],
      },
      {
        path: "/me",
        method: "get",
        secured: true,
        responses: ["200", "401", "500"],
      },
      {
        path: "/sites",
        method: "get",
        secured: true,
        responses: ["200", "401", "500"],
      },
      {
        path: "/domains",
        method: "get",
        secured: true,
        responses: ["200", "401", "500"],
      },
      {
        path: "/admin/users",
        method: "get",
        secured: true,
        responses: ["200", "401", "403", "500"],
      },
      {
        path: "/public/contact/submit",
        method: "post",
        secured: false,
        responses: ["200", "400", "429", "500"],
      },
    ];

    criticalPaths.forEach(({ path, method, secured, responses }) => {
      const pathConfig = openApiSpec.paths[path];
      expect(pathConfig, `missing OpenAPI path ${path}`).toBeDefined();

      const operation = pathConfig?.[method];
      expect(operation, `missing ${method.toUpperCase()} operation for ${path}`).toBeDefined();

      if (secured) {
        const security = Array.isArray(operation?.security) ? operation?.security : [];
        expect(security.length, `${path} ${method} missing security block`).toBeGreaterThan(0);
        expect(
          security.some((entry) => entry && typeof entry === "object" && "bearerAuth" in entry),
          `${path} ${method} must require bearerAuth`,
        ).toBe(true);
      }

      const opResponses = operation?.responses ?? {};
      responses.forEach((code) => {
        expect(opResponses, `${path} ${method} missing ${code} response`).toHaveProperty(code);
      });
    });
  });

  it("keeps navigation tags that power docs organization", () => {
    const tagNames = new Set(openApiSpec.tags.map((tag) => tag.name));
    ["Authentication", "Inbox", "Sites", "Domains", "Admin", "Public"].forEach((tag) => {
      expect(tagNames.has(tag)).toBe(true);
    });
  });
});
