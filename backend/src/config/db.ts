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
 * Helper untuk menjalankan seluruh skrip SQL migrasi berurutan
 */
export async function runMigrations(): Promise<void> {
  const migrationsDir = path.join(__dirname, '../db/migrations');
  if (!fs.existsSync(migrationsDir)) {
    console.warn(`[Migration] Directory not found at ${migrationsDir}`);
    return;
  }

  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const client = await pool.connect();
  try {
    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      console.log(`[Migration] Applying ${file}...`);
      const sql = fs.readFileSync(filePath, 'utf8');
      await client.query(sql);
    }
    console.log('[Migration] All migrations applied successfully.');
  } catch (error: any) {
    console.error('[Migration Error] Could not apply migrations:', error.message);
  } finally {
    client.release();
  }
}
