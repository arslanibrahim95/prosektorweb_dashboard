// Minimal CSV helpers (used by inbox export endpoints).
//
// Notes:
// - Uses UTF-8 BOM for better Excel compatibility.
// - Mitigates CSV/Excel formula injection by prefixing with `'` when value starts with
//   one of `= + - @`.

// Mitigates CSV/Excel formula injection by detecting values that start with
// characters interpreted as formula indicators by spreadsheet applications.
// Covers: = + - @ \t \r (tab and CR can also trigger formulas in some apps)
function isFormulaLike(value: string): boolean {
  return /^[=+\-@\t\r]/.test(value);
}

export function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";

  let s: string;

  if (typeof value === "string") {
    s = value;
  } else if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
    s = String(value);
  } else {
    // Keep structured values readable (e.g. `source` JSONB).
    try {
      s = JSON.stringify(value);
    } catch {
      s = String(value);
    }
  }

  // Quote first if needed (RFC 4180 compliance)
  const mustQuote = /[",\r\n]/.test(s);
  if (mustQuote) {
    s = `"${s.replace(/"/g, '""')}"`;
  }

  // SECURITY FIX: Apply formula injection protection AFTER quoting.
  // Some spreadsheets ignore the prefix inside quoted strings,
  // so we need to re-check the effective value.
  // For unquoted values: prefix directly. For quoted: wrap with prefix inside quotes.
  const effectiveStart = mustQuote && s.length > 1 ? s[1] : s[0];
  if (effectiveStart && isFormulaLike(effectiveStart)) {
    if (mustQuote) {
      // Insert prefix inside the opening quote: "=cmd" -> "'=cmd"
      s = `"'${s.slice(1)}`;
    } else {
      s = `'${s}`;
    }
  }

  return s;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  const lines: string[] = [];
  lines.push(headers.map(csvCell).join(","));
  for (const row of rows) {
    lines.push(row.map(csvCell).join(","));
  }

  // UTF-8 BOM + CRLF for widest compatibility.
  return `\ufeff${lines.join("\r\n")}\r\n`;
}

