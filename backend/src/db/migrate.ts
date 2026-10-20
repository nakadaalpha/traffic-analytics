import dotenv from 'dotenv';
import { runMigrations, pool } from '../config/db';

dotenv.config();

async function main() {
  console.log('[Runner] Starting database migration...');
  await runMigrations();
  await pool.end();
  console.log('[Runner] Migration finished.');
}

main().catch((err) => {
  console.error('[Runner Error]', err);
  process.exit(1);
});
