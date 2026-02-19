#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function migrateAuditLogs() {
    try {
        console.log('Starting audit logs migration...');

        // Read the schema file
        const schemaPath = path.join(__dirname, '../src/server/database/audit-logs-schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        // Execute the schema
        await pool.query(schema);

        console.log('Audit logs migration completed successfully!');

    } catch (error) {
        console.error('Error during audit logs migration:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

if (require.main === module) {
    migrateAuditLogs().catch(console.error);
}

module.exports = { migrateAuditLogs };