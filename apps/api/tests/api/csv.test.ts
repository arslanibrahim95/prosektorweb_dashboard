import { describe, it, expect } from "vitest";
import { csvCell, toCsv } from "../../src/server/api/csv";

describe("csv helpers", () => {
  describe("csvCell", () => {
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

    it("mitigates tab and carriage-return formula injection", () => {
      // Tab-prefixed values can trigger formula execution in some spreadsheet apps
      expect(csvCell("\t=1+1")).toBe("'\t=1+1");
      // CR-prefixed values: the '\r' in the result triggers CSV quoting
      // (the formula prefix "'" is added first, then CSV escaping wraps in quotes due to \r)
      expect(csvCell("\r=SUM(A1)")).toBe("\"'\r=SUM(A1)\"");
    });

    it("handles null and undefined", () => {
      expect(csvCell(null)).toBe("");
      expect(csvCell(undefined)).toBe("");
    });

    it("handles numbers", () => {
      expect(csvCell(123)).toBe("123");
      expect(csvCell(0)).toBe("0");
      // Negative numbers start with '-' which triggers formula injection protection
      expect(csvCell(-456)).toBe("'-456");
      expect(csvCell(3.14)).toBe("3.14");
    });

    it("handles booleans", () => {
      expect(csvCell(true)).toBe("true");
      expect(csvCell(false)).toBe("false");
    });

    it("handles bigint", () => {
      expect(csvCell(BigInt(9007199254740991))).toBe("9007199254740991");
    });

    it("handles objects by JSON stringifying", () => {
      const obj = { key: "value" };
      // JSON strings contain quotes which get escaped for CSV
      expect(csvCell(obj)).toBe('"{""key"":""value""}"');
    });

    it("handles arrays by JSON stringifying", () => {
      const arr = [1, 2, 3];
      // Arrays contain commas which require quoting
      expect(csvCell(arr)).toBe('"[1,2,3]"');
    });

    it("handles empty string", () => {
      expect(csvCell("")).toBe("");
    });

    it("handles strings without special characters", () => {
      expect(csvCell("simple text")).toBe("simple text");
    });

    it("handles carriage return", () => {
      expect(csvCell("line1\r\nline2")).toBe("\"line1\r\nline2\"");
    });

    it("handles multiple special characters together", () => {
      expect(csvCell("a,b\"c\nd")).toBe("\"a,b\"\"c\nd\"");
    });

    it("prevents formula injection with equals at start", () => {
      // Formula injection protection adds prefix, then quotes are escaped for CSV
      expect(csvCell("=HYPERLINK(\"http://evil.com\")")).toBe("\"'=HYPERLINK(\"\"http://evil.com\"\")\"");
    });

    it("prevents formula injection with plus at start", () => {
      expect(csvCell("+1-1")).toBe("'+1-1");
    });

    it("prevents formula injection with minus at start", () => {
      expect(csvCell("-1+1")).toBe("'-1+1");
    });

    it("prevents formula injection with at sign at start", () => {
      expect(csvCell("@SUM(A1)")).toBe("'@SUM(A1)");
    });

    it("does not add prefix for formula-like characters in middle", () => {
      expect(csvCell("test=value")).toBe("test=value");
      expect(csvCell("test+value")).toBe("test+value");
    });
  });

  describe("toCsv", () => {
    it("builds CSV with BOM + CRLF", () => {
      const csv = toCsv(["col"], [["=1+1"]]);
      expect(csv.startsWith("\ufeff")).toBe(true);
      expect(csv).toContain("'=1+1");
      expect(csv).toContain("\r\n");
    });

    it("handles multiple columns", () => {
      const csv = toCsv(["col1", "col2", "col3"], [["a", "b", "c"]]);
      expect(csv).toContain("col1,col2,col3");
      expect(csv).toContain("a,b,c");
    });

    it("handles multiple rows", () => {
      const csv = toCsv(["name"], [["Alice"], ["Bob"], ["Charlie"]]);
      expect(csv).toContain("Alice");
      expect(csv).toContain("Bob");
      expect(csv).toContain("Charlie");
    });

    it("handles empty data", () => {
      const csv = toCsv(["col"], []);
      expect(csv.startsWith("\ufeff")).toBe(true);
      expect(csv).toContain("col");
    });

    it("handles special characters in headers", () => {
      const csv = toCsv(["Name,First", "Email"], [["John", "john@test.com"]]);
      expect(csv).toContain("\"Name,First\"");
    });

    it("ends with CRLF", () => {
      const csv = toCsv(["col"], [["value"]]);
      expect(csv.endsWith("\r\n")).toBe(true);
    });

    it("uses CRLF between all lines", () => {
      const csv = toCsv(["col"], [["row1"], ["row2"]]);
      const lines = csv.split("\r\n");
      expect(lines.length).toBeGreaterThan(2);
    });
  });
});

