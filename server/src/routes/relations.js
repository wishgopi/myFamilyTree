import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

// helper: resolve external or internal id to internal uuid
async function resolveId(id) {
  const r = await pool.query('select id from person where external_id=$1 or id::text=$1', [id]);
  if (r.rowCount === 0) throw Object.assign(new Error('Person not found'), { status: 404 });
  return r.rows[0].id;
}

// POST /api/relations/parent-child { parent_id, child_id }
router.post('/parent-child', async (req, res, next) => {
  try {
    const parentId = await resolveId(req.body?.parent_id);
    const childId  = await resolveId(req.body?.child_id);
    await pool.query('insert into parent_child(parent_id, child_id) values ($1,$2) on conflict do nothing', [parentId, childId]);
    res.sendStatus(201);
  } catch (err) { next(err); }
});

// DELETE /api/relations/parent-child { parent_id, child_id }
router.delete('/parent-child', async (req, res, next) => {
  try {
    const parentId = await resolveId(req.body?.parent_id);
    const childId  = await resolveId(req.body?.child_id);
    await pool.query('delete from parent_child where parent_id=$1 and child_id=$2', [parentId, childId]);
    res.sendStatus(204);
  } catch (err) { next(err); }
});

// POST /api/relations/spouse { a_id, b_id }
router.post('/spouse', async (req, res, next) => {
  try {
    const aId = await resolveId(req.body?.a_id);
    const bId = await resolveId(req.body?.b_id);
    const [x,y] = aId < bId ? [aId, bId] : [bId, aId];
    await pool.query('insert into spouses(a,b) values ($1,$2) on conflict do nothing', [x,y]);
    res.sendStatus(201);
  } catch (err) { next(err); }
});

// DELETE /api/relations/spouse { a_id, b_id }
router.delete('/spouse', async (req, res, next) => {
  try {
    const aId = await resolveId(req.body?.a_id);
    const bId = await resolveId(req.body?.b_id);
    const [x,y] = aId < bId ? [aId, bId] : [bId, aId];
    await pool.query('delete from spouses where a=$1 and b=$2', [x,y]);
    res.sendStatus(204);
  } catch (err) { next(err); }
});

export default router;
