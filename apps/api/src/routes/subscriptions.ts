import { Hono } from 'hono';
import {
  generateId,
  createSubscriptionSchema,
  cancelSubscriptionSchema,
  changeSubscriptionPriceSchema,
} from '@billforge/shared';
import {
  createSubscriptionState,
  cancelSubscription as cancelSub,
  buildProrationLineItems,
  sumLineItems,
} from '@billforge/billing-core';
import { db, intToBool } from '../db/index.js';
import { dispatchWebhook } from '../services/webhooks.js';

export const subscriptionRoutes = new Hono();

function mapSubscription(row: any) {
  return {
    ...row,
    object: 'subscription',
    cancel_at_period_end: intToBool(row.cancel_at_period_end),
  };
}

subscriptionRoutes.post('/subscriptions', async (c) => {
  const merchant = c.get('merchant') as { id: string };
  const body = createSubscriptionSchema.parse(await c.req.json());

  const customer = db.prepare('SELECT id FROM customers WHERE id = ? AND merchant_id = ?').get(body.customer, merchant.id);
  const price = db.prepare('SELECT * FROM prices WHERE id = ? AND merchant_id = ?').get(body.price, merchant.id) as any;
  if (!customer || !price) {
    return c.json({ error: { type: 'invalid_request', message: 'Customer or price not found' } }, 404);
  }

  const id = generateId('subscription');
  const created_at = new Date().toISOString();
  const state = createSubscriptionState({
    trialDays: body.trial_days,
    interval: price.interval ?? 'month',
    intervalCount: price.interval_count,
  });

  db.prepare(`INSERT INTO subscriptions (id, merchant_id, customer_id, price_id, status, trial_end, current_period_start, current_period_end, cancel_at_period_end, canceled_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, ?)`)
    .run(id, merchant.id, body.customer, body.price, state.status, state.trial_end, state.current_period_start, state.current_period_end, created_at);

  const sub = mapSubscription(db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(id));
  await dispatchWebhook(merchant.id, 'customer.subscription.created', { object: sub });
  return c.json(sub);
});

subscriptionRoutes.get('/subscriptions', (c) => {
  const merchant = c.get('merchant') as { id: string };
  const rows = db.prepare('SELECT * FROM subscriptions WHERE merchant_id = ? ORDER BY created_at DESC').all(merchant.id);
  return c.json({ object: 'list', data: rows.map(mapSubscription) });
});

subscriptionRoutes.get('/subscriptions/:id', (c) => {
  const merchant = c.get('merchant') as { id: string };
  const row = db.prepare('SELECT * FROM subscriptions WHERE id = ? AND merchant_id = ?').get(c.req.param('id'), merchant.id);
  if (!row) return c.json({ error: { type: 'invalid_request', message: 'Subscription not found' } }, 404);
  return c.json(mapSubscription(row));
});

subscriptionRoutes.post('/subscriptions/:id/cancel', async (c) => {
  const merchant = c.get('merchant') as { id: string };
  const body = cancelSubscriptionSchema.parse(await c.req.json().catch(() => ({})));
  const row = db.prepare('SELECT * FROM subscriptions WHERE id = ? AND merchant_id = ?').get(c.req.param('id'), merchant.id) as any;
  if (!row) return c.json({ error: { type: 'invalid_request', message: 'Subscription not found' } }, 404);

  const updated = cancelSub(mapSubscription(row), body.cancel_at_period_end);
  db.prepare('UPDATE subscriptions SET status = ?, cancel_at_period_end = ?, canceled_at = ? WHERE id = ?')
    .run(updated.status, updated.cancel_at_period_end ? 1 : 0, updated.canceled_at, row.id);

  const sub = mapSubscription(db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(row.id));
  await dispatchWebhook(merchant.id, 'customer.subscription.updated', { object: sub });
  return c.json(sub);
});

subscriptionRoutes.post('/subscriptions/:id/change_price', async (c) => {
  const merchant = c.get('merchant') as { id: string };
  const body = changeSubscriptionPriceSchema.parse(await c.req.json());
  const sub = db.prepare('SELECT * FROM subscriptions WHERE id = ? AND merchant_id = ?').get(c.req.param('id'), merchant.id) as any;
  if (!sub) return c.json({ error: { type: 'invalid_request', message: 'Subscription not found' } }, 404);

  const oldPrice = db.prepare('SELECT * FROM prices WHERE id = ?').get(sub.price_id) as any;
  const newPrice = db.prepare('SELECT * FROM prices WHERE id = ? AND merchant_id = ?').get(body.price, merchant.id) as any;
  if (!newPrice) return c.json({ error: { type: 'invalid_request', message: 'Price not found' } }, 404);

  const now = new Date();
  const invoiceId = generateId('invoice');
  const created_at = now.toISOString();
  const lineItems = buildProrationLineItems(
    invoiceId,
    oldPrice.nickname,
    newPrice.nickname,
    oldPrice.unit_amount,
    newPrice.unit_amount,
    new Date(sub.current_period_start),
    new Date(sub.current_period_end),
    now,
  );
  const total = sumLineItems(lineItems);

  if (lineItems.length > 0) {
    db.prepare(`INSERT INTO invoices (id, merchant_id, customer_id, subscription_id, status, subtotal, total, currency, period_start, period_end, paid_at, created_at)
      VALUES (?, ?, ?, ?, 'open', ?, ?, ?, ?, ?, NULL, ?)`)
      .run(invoiceId, merchant.id, sub.customer_id, sub.id, total, total, newPrice.currency, sub.current_period_start, sub.current_period_end, created_at);

    const insertLine = db.prepare('INSERT INTO invoice_line_items (id, invoice_id, description, quantity, unit_amount, amount, type) VALUES (?, ?, ?, ?, ?, ?, ?)');
    for (const item of lineItems) {
      insertLine.run(item.id, invoiceId, item.description, item.quantity, item.unit_amount, item.amount, item.type);
    }
    await dispatchWebhook(merchant.id, 'invoice.created', { id: invoiceId, total });
  }

  db.prepare('UPDATE subscriptions SET price_id = ? WHERE id = ?').run(body.price, sub.id);
  const updated = mapSubscription(db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(sub.id));
  await dispatchWebhook(merchant.id, 'customer.subscription.updated', { object: updated });
  return c.json(updated);
});
