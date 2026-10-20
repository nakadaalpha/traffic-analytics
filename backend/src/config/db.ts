import { Pool, PoolConfig } from 'pg';
import fs from 'fs';
import path from 'path';

const poolConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/cta_tracking',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 3000,
};

export const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('[DB Pool Error] Unexpected client error:', err.message);
});

/**
 * Helper untuk menjalankan migrasi skrip SQL (001_create_tracking_tables.sql)
 */
export async function runMigrations(): Promise<void> {
  const migrationPath = path.join(__dirname, '../db/migrations/001_create_tracking_tables.sql');
  if (!fs.existsSync(migrationPath)) {
    console.warn(`[Migration] File not found at ${migrationPath}`);
    return;
  }

  const sql = fs.readFileSync(migrationPath, 'utf8');
  try {
    const client = await pool.connect();
    try {
      console.log('[Migration] Applying database migrations...');
      await client.query(sql);
      console.log('[Migration] Migrations applied successfully.');
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('[Migration Error] Could not apply migrations:', error.message);
  }
}
