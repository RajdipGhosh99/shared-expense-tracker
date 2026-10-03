import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
const envPath = fs.existsSync('.env') ? '.env' : path.resolve('backend/.env');
dotenv.config({ path: envPath });
import { createClient } from '@libsql/client';
async function main() {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    console.log(`📡 Connecting to Turso Cloud at: ${url}...`);
    const client = createClient({
        url: url,
        authToken: authToken,
    });
    // Test ping
    const ping = await client.execute('SELECT 1 as connected, datetime() as cloud_time');
    console.log('✅ Connected to Turso Cloud successfully!');
    console.log('Server response:', ping.rows[0]);
    // Create tables
    console.log('🛠️ Provisioning tables on Turso cloud database...');
    await client.batch([
        `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        upi_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );`,
        `CREATE TABLE IF NOT EXISTS groups (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        invite_code TEXT UNIQUE NOT NULL,
        currency TEXT DEFAULT 'INR',
        google_sheet_sync INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );`,
        `CREATE TABLE IF NOT EXISTS group_members (
        id TEXT PRIMARY KEY,
        group_id TEXT NOT NULL REFERENCES groups(id),
        user_email TEXT NOT NULL,
        name TEXT NOT NULL,
        upi_id TEXT,
        role TEXT DEFAULT 'MEMBER',
        is_away INTEGER DEFAULT 0,
        away_until TEXT,
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(group_id, user_email)
      );`,
        `CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY,
        group_id TEXT REFERENCES groups(id),
        flat_id TEXT,
        payer_email TEXT NOT NULL,
        title TEXT NOT NULL,
        amount_minor_units INTEGER NOT NULL,
        amount_display REAL NOT NULL,
        category TEXT NOT NULL,
        split_type TEXT NOT NULL,
        splits_json TEXT NOT NULL,
        utr_number TEXT,
        overwritten_flag TEXT DEFAULT 'NO',
        original_expense_id TEXT,
        duplicate_of_id TEXT,
        sheet_row_index INTEGER,
        sheet_row_link TEXT,
        history_log TEXT,
        sheet_sync_status TEXT DEFAULT 'PENDING',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );`,
        `CREATE TABLE IF NOT EXISTS settlements (
        id TEXT PRIMARY KEY,
        group_id TEXT REFERENCES groups(id),
        flat_id TEXT,
        payer_email TEXT NOT NULL,
        receiver_email TEXT NOT NULL,
        amount_minor_units INTEGER NOT NULL,
        amount_display REAL NOT NULL,
        notes TEXT,
        settled_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );`,
        `CREATE TABLE IF NOT EXISTS monthly_statements (
        id TEXT PRIMARY KEY,
        group_id TEXT REFERENCES groups(id),
        flat_id TEXT,
        month_label TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        total_spend REAL NOT NULL,
        data_json TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );`,
    ], 'write');
    // Safe alters for existing tables
    for (const alterSql of [
        'ALTER TABLE expenses ADD COLUMN group_id TEXT;',
        'ALTER TABLE settlements ADD COLUMN group_id TEXT;',
        'ALTER TABLE monthly_statements ADD COLUMN group_id TEXT;',
        'UPDATE expenses SET group_id = flat_id WHERE group_id IS NULL;',
        'UPDATE settlements SET group_id = flat_id WHERE group_id IS NULL;',
        'UPDATE monthly_statements SET group_id = flat_id WHERE group_id IS NULL;',
        'INSERT OR IGNORE INTO groups (id, name, invite_code, currency, google_sheet_sync, created_at) SELECT id, name, invite_code, currency, google_sheet_sync, created_at FROM flats;',
        'INSERT OR IGNORE INTO group_members (id, group_id, user_email, name, upi_id, role, is_away, away_until, joined_at) SELECT id, flat_id, user_email, name, upi_id, role, is_away, away_until, joined_at FROM flat_members;',
    ]) {
        try {
            await client.execute(alterSql);
        }
        catch { }
    }
    // Create indexes
    await client.batch([
        `CREATE INDEX IF NOT EXISTS idx_expenses_group ON expenses(group_id);`,
        `CREATE INDEX IF NOT EXISTS idx_expenses_flat ON expenses(flat_id);`,
        `CREATE INDEX IF NOT EXISTS idx_expenses_utr ON expenses(group_id, utr_number);`,
        `CREATE INDEX IF NOT EXISTS idx_settlements_group ON settlements(group_id);`,
        `CREATE INDEX IF NOT EXISTS idx_settlements_flat ON settlements(flat_id);`,
    ], 'write');
    console.log('✅ All tables and indexes provisioned successfully on Turso Cloud!');
    // Verify tables
    const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;");
    console.log('📋 Active tables in Turso Cloud:');
    tables.rows.forEach((r) => console.log(`   - ${r.name}`));
}
main().catch((err) => {
    console.error('❌ Connection to Turso failed:', err);
    process.exit(1);
});
//# sourceMappingURL=testTursoConnection.js.map