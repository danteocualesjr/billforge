import type { Context, Next } from 'hono';
import { db } from '../db/index.js';

export async function idempotencyMiddleware(c: Context, next: Next) {
  const key = c.req.header('Idempotency-Key');
  if (!key) {
    await next();
    return;
  }

  const merchant = c.get('merchant') as { id: string };
  const existing = db.prepare('SELECT response FROM idempotency_keys WHERE key = ? AND merchant_id = ?')
    .get(key, merchant.id) as { response: string } | undefined;

  if (existing) {
    return c.json(JSON.parse(existing.response));
  }

  await next();

  if (c.res.status < 400) {
    const cloned = c.res.clone();
    const body = await cloned.text();
    db.prepare('INSERT INTO idempotency_keys (key, merchant_id, response, created_at) VALUES (?, ?, ?, ?)')
      .run(key, merchant.id, body, new Date().toISOString());
  }
}
