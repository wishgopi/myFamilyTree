import fs from 'fs';
import path from 'path';
import url from 'url';
import { pool } from '../src/db.js';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

async function main() {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'migrations', '01_schema.sql'), 'utf8');
  await pool.query(sql);
  console.log('Migration applied');
  await pool.end();
}

main().catch(async (e) => {
  console.error(e);
  await pool.end();
  process.exit(1);
});
