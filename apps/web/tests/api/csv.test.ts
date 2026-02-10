import { describe, it, expect } from "vitest";
import { csvCell, toCsv } from "../../src/server/api/csv";

describe("csv helpers", () => {
  it("escapes commas/quotes/newlines", () => {
    expect(csvCell("a,b")).toBe("\"a,b\"");
    expect(csvCell("a\"b")).toBe("\"a\"\"b\"");
    expect(csvCell("a\nb")).toBe("\"a\nb\"");
  });

  it("mitigates Excel formula injection", () => {
    expect(csvCell("=1+1")).toBe("'=1+1");
    expect(csvCell("+SUM(A1:A2)")).toBe("'+SUM(A1:A2)");
    expect(csvCell("-1+2")).toBe("'-1+2");
    expect(csvCell("@cmd")).toBe("'@cmd");
  });

  it("builds CSV with BOM + CRLF", () => {
    const csv = toCsv(["col"], [["=1+1"]]);
    expect(csv.startsWith("\ufeff")).toBe(true);
    expect(csv).toContain("'=1+1");
    expect(csv).toContain("\r\n");
  });
});

