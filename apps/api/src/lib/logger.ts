const SENSITIVE_KEY_PATTERN = /(authorization|token|secret|password|pass|cookie|connection|credential|session|url|key)/i;

type LogLevel = "info" | "warn" | "error";

function isSensitiveKey(key: string | number | undefined): boolean {
    if (key === undefined) return false;
    return SENSITIVE_KEY_PATTERN.test(String(key));
}

function sanitizeValue(
    key: string | number | undefined,
    value: unknown,
    seen: WeakSet<object>,
): unknown {
    if (value === null || value === undefined) {
        return value;
    }

    if (typeof value === "string") {
        return isSensitiveKey(key) ? "[REDACTED]" : value;
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
            return value.map((item, index) => sanitizeValue(index, item, seen));
        }

        if (value instanceof Map) {
            const obj: Record<string, unknown> = {};
            for (const [mapKey, mapValue] of value.entries()) {
                obj[String(mapKey)] = sanitizeValue(mapKey, mapValue, seen);
            }
            return obj;
        }

        if (value instanceof Set) {
            return Array.from(value).map((item) => sanitizeValue(undefined, item, seen));
        }

        const sanitized: Record<string, unknown> = {};
        for (const [childKey, childValue] of Object.entries(value)) {
            sanitized[childKey] = sanitizeValue(childKey, childValue, seen);
        }
        return sanitized;
    }

    return value;
}

function sanitizeMeta(meta: unknown): unknown {
    if (meta === undefined) {
        return undefined;
    }
    return sanitizeValue(undefined, meta, new WeakSet<object>());
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

    const formatter = console[level] ?? console.log;
    formatter.call(console, JSON.stringify(entry));
}

export const logger = {
    info: (message: string, meta?: unknown) => log("info", message, meta),
    warn: (message: string, meta?: unknown) => log("warn", message, meta),
    error: (message: string, meta?: unknown) => log("error", message, meta),
};
