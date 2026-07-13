import { Hono } from 'hono';
import { generateId, createCustomerSchema, createProductSchema, createPriceSchema } from '@billforge/shared';
import { db } from '../db/index.js';

export const catalogRoutes = new Hono();

catalogRoutes.post('/customers', async (c) => {
  const merchant = c.get('merchant') as { id: string };
  const body = createCustomerSchema.parse(await c.req.json());
  const id = generateId('customer');
  const created_at = new Date().toISOString();
  db.prepare('INSERT INTO customers (id, merchant_id, email, name, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(id, merchant.id, body.email, body.name, created_at);
  return c.json({ id, object: 'customer', email: body.email, name: body.name, created_at });
});

catalogRoutes.get('/customers', (c) => {
  const merchant = c.get('merchant') as { id: string };
  const rows = db.prepare('SELECT * FROM customers WHERE merchant_id = ? ORDER BY created_at DESC').all(merchant.id);
  return c.json({ object: 'list', data: rows.map((r: any) => ({ ...r, object: 'customer' })) });
});

catalogRoutes.post('/products', async (c) => {
  const merchant = c.get('merchant') as { id: string };
  const body = createProductSchema.parse(await c.req.json());
  const id = generateId('product');
  const created_at = new Date().toISOString();
  db.prepare('INSERT INTO products (id, merchant_id, name, description, active, created_at) VALUES (?, ?, ?, ?, 1, ?)')
    .run(id, merchant.id, body.name, body.description ?? null, created_at);
  return c.json({ id, object: 'product', name: body.name, description: body.description ?? null, active: true, created_at });
});

catalogRoutes.get('/products', (c) => {
  const merchant = c.get('merchant') as { id: string };
  const rows = db.prepare('SELECT * FROM products WHERE merchant_id = ? ORDER BY created_at DESC').all(merchant.id);
  return c.json({ object: 'list', data: rows.map((r: any) => ({ ...r, object: 'product', active: !!r.active })) });
});

catalogRoutes.post('/prices', async (c) => {
  const merchant = c.get('merchant') as { id: string };
  const body = createPriceSchema.parse(await c.req.json());
  const product = db.prepare('SELECT id FROM products WHERE id = ? AND merchant_id = ?').get(body.product, merchant.id);
  if (!product) return c.json({ error: { type: 'invalid_request', message: 'Product not found' } }, 404);

  const id = generateId('price');
  const created_at = new Date().toISOString();
  const interval = body.type === 'recurring' ? (body.interval ?? 'month') : null;

  db.prepare(`INSERT INTO prices (id, merchant_id, product_id, nickname, unit_amount, currency, type, interval, interval_count, included_units, active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`)
    .run(id, merchant.id, body.product, body.nickname, body.unit_amount, body.currency, body.type, interval, body.interval_count, body.included_units, created_at);

  return c.json({
    id, object: 'price', product: body.product, nickname: body.nickname,
    unit_amount: body.unit_amount, currency: body.currency, type: body.type,
    interval, interval_count: body.interval_count, included_units: body.included_units,
    active: true, created_at,
  });
});

catalogRoutes.get('/prices', (c) => {
  const merchant = c.get('merchant') as { id: string };
  const rows = db.prepare('SELECT * FROM prices WHERE merchant_id = ? ORDER BY created_at DESC').all(merchant.id);
  return c.json({ object: 'list', data: rows.map((r: any) => ({ ...r, object: 'price', active: !!r.active })) });
});
