import 'dotenv/config';
import express from 'express';

const app = express();
const port = Number(process.env.PORT) || 3000;

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'eatnext-backend' });
});

app.listen(port, () => {
  console.log(`EatNext backend listening on http://localhost:${port}`);
});
