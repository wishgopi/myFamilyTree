import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

// Helper to map DB row to frontend data shape
function toDataBlock(row) {
  return {
    'first name': row.first_name ?? '',
    'last name': row.last_name ?? '',
    birthday: row.birthday ?? '',
    avatar: row.avatar ?? '',
    gender: row.gender ?? ''
  };
}

// GET /api/persons -> array in the same shape as data.json
router.get('/', async (req, res, next) => {
  try {
    const personsRes = await pool.query('select * from person');
    const persons = personsRes.rows;

    const pcRes = await pool.query('select parent_id, child_id from parent_child');
    const spRes = await pool.query('select a, b from spouses');

    const map = new Map();
    for (const p of persons) {
      const id = p.external_id || p.id; // prefer external_id to preserve original ids
      map.set(p.id, {
        id: String(id),
        data: toDataBlock(p),
        rels: { spouses: [], parents: [], children: [] }
      });
    }

    for (const { parent_id, child_id } of pcRes.rows) {
      const parent = map.get(parent_id);
      const child = map.get(child_id);
      if (parent && child) {
        parent.rels.children.push(String(child.id));
        child.rels.parents.push(String(parent.id));
      }
    }

    for (const { a, b } of spRes.rows) {
      const ra = map.get(a);
      const rb = map.get(b);
      if (ra && rb) {
        ra.rels.spouses.push(String(rb.id));
        rb.rels.spouses.push(String(ra.id));
      }
    }

    res.json(Array.from(map.values()));
  } catch (err) {
    next(err);
  }
});

// POST /api/persons { id?, data }
router.post('/', async (req, res, next) => {
  try {
    const { id: external_id, data } = req.body || {};
    const first_name = data?.['first name'] ?? '';
    const last_name = data?.['last name'] ?? '';
    const birthday = data?.birthday ?? '';
    const avatar = data?.avatar ?? '';
    const gender = data?.gender ?? '';

    const insert = await pool.query(
      `insert into person (external_id, first_name, last_name, birthday, avatar, gender)
       values ($1,$2,$3,$4,$5,$6) returning *`,
      [external_id ?? null, first_name, last_name, birthday, avatar, gender]
    );
    const row = insert.rows[0];
    res.status(201).json({ id: String(row.external_id || row.id), data: toDataBlock(row), rels: { spouses: [], parents: [], children: [] } });
  } catch (err) {
    next(err);
  }
});

// PUT /api/persons/:id { data }
router.put('/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const { data } = req.body || {};
    const first_name = data?.['first name'] ?? '';
    const last_name = data?.['last name'] ?? '';
    const birthday = data?.birthday ?? '';
    const avatar = data?.avatar ?? '';
    const gender = data?.gender ?? '';

    const upd = await pool.query(
      `update person set first_name=$1,last_name=$2,birthday=$3,avatar=$4,gender=$5
       where (external_id=$6) or (id::text=$6)
       returning *`,
      [first_name, last_name, birthday, avatar, gender, id]
    );
    if (upd.rowCount === 0) return res.sendStatus(404);
    const row = upd.rows[0];
    res.json({ id: String(row.external_id || row.id), data: toDataBlock(row) });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/persons/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const del = await pool.query(
      `delete from person where (external_id=$1) or (id::text=$1)`,
      [id]
    );
    if (del.rowCount === 0) return res.sendStatus(404);
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

export default router;
