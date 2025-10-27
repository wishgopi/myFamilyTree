import fs from 'fs';
import path from 'path';
import url from 'url';
import { pool } from '../src/db.js';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

async function main() {
  const dataPath = path.join(__dirname, '..', '..', 'examples', 'data', 'data.json');
  const raw = fs.readFileSync(dataPath, 'utf8');
  const items = JSON.parse(raw);

  // insert persons first
  const extToId = new Map();
  for (const item of items) {
    const ext = String(item.id);
    const d = item.data || {};
    const r = await pool.query(
      `insert into person (external_id, first_name, last_name, birthday, avatar, gender)
       values ($1,$2,$3,$4,$5,$6)
       on conflict (external_id) do update set
         first_name=excluded.first_name,
         last_name=excluded.last_name,
         birthday=excluded.birthday,
         avatar=excluded.avatar,
         gender=excluded.gender
       returning id`,
      [ext, d['first name'] || '', d['last name'] || '', d['birthday'] || '', d['avatar'] || '', d['gender'] || '']
    );
    extToId.set(ext, r.rows[0].id);
  }

  // clear relations
  await pool.query('delete from parent_child');
  await pool.query('delete from spouses');

  // insert relations
  for (const item of items) {
    const me = extToId.get(String(item.id));
    const rels = item.rels || {};

    for (const childExt of rels.children || []) {
      const child = extToId.get(String(childExt));
      if (child) await pool.query('insert into parent_child(parent_id, child_id) values ($1,$2) on conflict do nothing', [me, child]);
    }

    for (const spExt of rels.spouses || []) {
      const sp = extToId.get(String(spExt));
      if (sp) {
        const [a,b] = me < sp ? [me, sp] : [sp, me];
        await pool.query('insert into spouses(a,b) values ($1,$2) on conflict do nothing', [a,b]);
      }
    }
  }

  console.log('Imported', items.length, 'persons');
  await pool.end();
}

main().catch(async (e) => {
  console.error(e);
  await pool.end();
  process.exit(1);
});
