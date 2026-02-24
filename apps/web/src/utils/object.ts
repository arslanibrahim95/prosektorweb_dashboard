type PlainObject = Record<string, unknown>;

function isPlainObject(val: unknown): val is PlainObject {
    return val !== null && typeof val === "object" && !Array.isArray(val);
}

/**
 * Recursively merges source into target.
 * - Plain objects: merged recursively
 * - Arrays: replaced (not merged) to avoid surprising index-based merges
 * - Primitives / undefined: source value wins when defined
 */
export function deepMerge<T extends PlainObject>(target: T, source: Partial<T>): T {
    const result: PlainObject = { ...target };
    for (const key of Object.keys(source)) {
        const targetVal = target[key];
        const sourceVal = (source as PlainObject)[key];
        if (isPlainObject(targetVal) && isPlainObject(sourceVal)) {
            result[key] = deepMerge(targetVal, sourceVal);
        } else if (sourceVal !== undefined) {
            result[key] = sourceVal;
        }
    }
    return result as T;
}
