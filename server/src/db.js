import dotenv from 'dotenv';
import pkg from 'pg';

dotenv.config();
const { Pool } = pkg;

export const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'familytree',
  port: Number(process.env.PGPORT || 5432),
});

export async function query(text, params) {
  const res = await pool.query(text, params);
  return res;
}
