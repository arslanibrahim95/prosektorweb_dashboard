"use client";

import { logger } from "@/lib/logger";

/**
 * Storage utilities with quota handling
 */

export class StorageError extends Error {
    constructor(message: string, public code: string) {
        super(message);
        this.name = "StorageError";
    }
}

/**
 * Safely sets item in localStorage with quota handling
 */
export const safeStorageSet = (key: string, value: string): void => {
    try {
        localStorage.setItem(key, value);
    } catch (e) {
        if (e instanceof DOMException) {
            if (e.name === "QuotaExceededError") {
                logger.warn(`localStorage quota exceeded for key`, { key });

                const keysToRemove = Object.keys(localStorage).filter(
                    (k) => k.includes("theme") && !k.includes(key)
                );
                keysToRemove.forEach((k) => localStorage.removeItem(k));

                try {
                    localStorage.setItem(key, value);
                } catch {
                    throw new StorageError("Failed to save preference: Storage full", "QUOTA_EXCEEDED");
                }
            } else if (e.name === "SecurityError") {
                throw new StorageError("Storage access denied", "SECURITY_ERROR");
            }
        }
        throw new StorageError("Failed to save preference", "UNKNOWN_ERROR");
    }
};

/**
 * Safely gets item from localStorage
 */
export const safeStorageGet = (key: string): string | null => {
    try {
        return localStorage.getItem(key);
    } catch (e) {
        logger.warn(`Failed to read from localStorage`, { key, error: e });
        return null;
    }
};
