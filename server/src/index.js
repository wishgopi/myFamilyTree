import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import personsRouter from './routes/person.js';
import relationsRouter from './routes/relations.js';

dotenv.config();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/persons', personsRouter);
app.use('/api/relations', relationsRouter);

const port = Number(process.env.PORT || 3001);
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
