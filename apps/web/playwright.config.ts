import { defineConfig } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Lightweight env file loader (no dotenv dependency needed).
 * Loads KEY=VALUE pairs from a file into process.env without overwriting.
 */
function loadEnvFile(filePath: string) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        for (const line of content.split('\n')) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            const eqIdx = trimmed.indexOf('=');
            if (eqIdx === -1) continue;
            const key = trimmed.slice(0, eqIdx).trim();
            const value = trimmed.slice(eqIdx + 1).trim();
            if (!process.env[key]) {
                process.env[key] = value;
            }
        }
    } catch {
        // File not found — skip silently
    }
}

// Load env files for SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL, etc.
loadEnvFile(path.resolve(__dirname, '.env.local'));
loadEnvFile(path.resolve(__dirname, '../../.env'));
loadEnvFile(path.resolve(__dirname, '../../apps/api/.env.local'));

export default defineConfig({
    testDir: './tests/e2e',
    timeout: 60000,
    use: {
        baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    },
});
