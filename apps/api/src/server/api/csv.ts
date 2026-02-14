// Minimal CSV helpers (used by inbox export endpoints).
//
// Notes:
// - Uses UTF-8 BOM for better Excel compatibility.
// - Mitigates CSV/Excel formula injection by prefixing with `'` when value starts with
//   one of `= + - @`.

function isFormulaLike(value: string): boolean {
  return /^[=+\-@]/.test(value);
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

  // Protect against Excel formula injection when users open the CSV.
  if (s.length > 0 && isFormulaLike(s)) {
    s = `'${s}`;
  }

  const mustQuote = /[",\r\n]/.test(s);
  if (!mustQuote) return s;

  return `"${s.replace(/"/g, '""')}"`;
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

