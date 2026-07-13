import { Hono } from 'hono';
import { generateId, createWebhookEndpointSchema } from '@billforge/shared';
import { db } from '../db/index.js';

export const webhookRoutes = new Hono();

webhookRoutes.post('/webhook_endpoints', async (c) => {
  const merchant = c.get('merchant') as { id: string };
  const body = createWebhookEndpointSchema.parse(await c.req.json());
  const id = generateId('webhook');
  const secret = crypto.randomUUID();
  const created_at = new Date().toISOString();
  db.prepare('INSERT INTO webhook_endpoints (id, merchant_id, url, secret, enabled, created_at) VALUES (?, ?, ?, ?, 1, ?)')
    .run(id, merchant.id, body.url, secret, created_at);
  return c.json({ id, object: 'webhook_endpoint', url: body.url, secret, enabled: true, created_at });
});

webhookRoutes.get('/webhook_endpoints', (c) => {
  const merchant = c.get('merchant') as { id: string };
  const rows = db.prepare('SELECT id, merchant_id, url, enabled, created_at FROM webhook_endpoints WHERE merchant_id = ?').all(merchant.id);
  return c.json({ object: 'list', data: rows.map((r: any) => ({ ...r, object: 'webhook_endpoint', enabled: !!r.enabled })) });
});
