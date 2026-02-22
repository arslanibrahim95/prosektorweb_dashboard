const SENSITIVE_KEY_PATTERN = /(authorization|token|secret|password|pass|cookie|connection|credential|session|url|key)/i;

const SENSITIVE_VALUE_PATTERN = /(eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}|sk_live_[A-Za-z0-9]{20,}|service[_-]role|Bearer\s+[A-Za-z0-9_-]{10,}|Bearer\s+$)/i;

type LogLevel = "info" | "warn" | "error";

function isSensitiveKey(key: string | number | undefined): boolean {
  if (key === undefined) {
    return false;
  }
  return SENSITIVE_KEY_PATTERN.test(String(key));
}

function containsSensitiveValue(value: string): boolean {
  return SENSITIVE_VALUE_PATTERN.test(value);
}

function sanitizeValue(
  key: string | number | undefined,
  value: unknown,
  seen: WeakSet<object>,
  depth: number = 0
): unknown {
  if (depth > 10) {
    return "[Max Depth Exceeded]";
  }

  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === "string") {
    if (isSensitiveKey(key) || containsSensitiveValue(value)) {
      return "[REDACTED]";
    }
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "object") {
    if (seen.has(value as object)) {
      return "[Circular]";
    }
    seen.add(value as object);

    if (Array.isArray(value)) {
      return value.map((item, index) => sanitizeValue(index, item, seen, depth + 1));
    }

    if (value instanceof Map) {
      const obj: Record<string, unknown> = {};
      for (const [mapKey, mapValue] of value.entries()) {
        obj[String(mapKey)] = sanitizeValue(mapKey, mapValue, seen, depth + 1);
      }
      return obj;
    }

    if (value instanceof Set) {
      return Array.from(value).map((item) => sanitizeValue(undefined, item, seen, depth + 1));
    }

    const sanitized: Record<string, unknown> = {};
    for (const [childKey, childValue] of Object.entries(value)) {
      sanitized[childKey] = sanitizeValue(childKey, childValue, seen, depth + 1);
    }
    return sanitized;
  }

  return value;
}

function sanitizeMeta(meta: unknown): unknown {
  if (meta === undefined) {
    return undefined;
  }
  return sanitizeValue(undefined, meta, new WeakSet<object>(), 0);
}

function log(level: LogLevel, message: string, meta?: unknown) {
  const entry: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    level,
    message,
  };

  const sanitizedMeta = sanitizeMeta(meta);
  if (sanitizedMeta !== undefined) {
    entry.meta = sanitizedMeta;
  }

  const formatter = (console[level] ?? console.log).bind(console);
  formatter(entry);
}

export const logger = {
  info: (message: string, meta?: unknown) => log("info", message, meta),
  warn: (message: string, meta?: unknown) => log("warn", message, meta),
  error: (message: string, meta?: unknown) => log("error", message, meta),
};
