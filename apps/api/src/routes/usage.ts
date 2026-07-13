import { Hono } from 'hono';
import { generateId, createUsageRecordSchema } from '@billforge/shared';
import { db } from '../db/index.js';

export const usageRoutes = new Hono();

usageRoutes.post('/usage_records', async (c) => {
  const merchant = c.get('merchant') as { id: string };
  const body = createUsageRecordSchema.parse(await c.req.json());
  const sub = db.prepare('SELECT id FROM subscriptions WHERE id = ? AND merchant_id = ?').get(body.subscription, merchant.id);
  if (!sub) return c.json({ error: { type: 'invalid_request', message: 'Subscription not found' } }, 404);

  const id = generateId('usage');
  const timestamp = body.timestamp ?? new Date().toISOString();
  const created_at = new Date().toISOString();
  db.prepare('INSERT INTO usage_records (id, merchant_id, subscription_id, quantity, timestamp, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, merchant.id, body.subscription, body.quantity, timestamp, created_at);

  return c.json({ id, object: 'usage_record', subscription: body.subscription, quantity: body.quantity, timestamp, created_at });
});

usageRoutes.get('/usage_records', (c) => {
  const merchant = c.get('merchant') as { id: string };
  const subscription = c.req.query('subscription');
  const rows = subscription
    ? db.prepare('SELECT * FROM usage_records WHERE merchant_id = ? AND subscription_id = ? ORDER BY timestamp DESC').all(merchant.id, subscription)
    : db.prepare('SELECT * FROM usage_records WHERE merchant_id = ? ORDER BY timestamp DESC').all(merchant.id);
  return c.json({ object: 'list', data: rows.map((r: any) => ({ ...r, object: 'usage_record' })) });
});
