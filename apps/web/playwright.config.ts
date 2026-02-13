import { defineConfig } from '@playwright/test';
import path from 'path';

export default defineConfig({
    testDir: './tests/e2e',
    use: {
        baseURL: process.env.DASHBOARD_API_HOST || 'http://localhost:3000',
    },
});
