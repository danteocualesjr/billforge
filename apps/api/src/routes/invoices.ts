import { Hono } from 'hono';
import { generateId } from '@billforge/shared';
import {
  advanceSubscriptionPeriod,
  buildSubscriptionLineItem,
  buildMeteredLineItem,
  summarizeMeteredUsage,
  sumLineItems,
} from '@billforge/billing-core';
import { db, intToBool } from '../db/index.js';
import { dispatchWebhook } from '../services/webhooks.js';

export const invoiceRoutes = new Hono();

const PAYABLE_STATUSES = new Set(['open', 'past_due']);
const MAX_CATCH_UP_PERIODS = 12;

function getLineItems(invoiceId: string) {
  return db.prepare('SELECT * FROM invoice_line_items WHERE invoice_id = ?').all(invoiceId);
}

function mapInvoice(row: any) {
  return { ...row, object: 'invoice', line_items: getLineItems(row.id) };
}

invoiceRoutes.get('/invoices', (c) => {
  const merchant = c.get('merchant') as { id: string };
  const rows = db.prepare('SELECT * FROM invoices WHERE merchant_id = ? ORDER BY created_at DESC').all(merchant.id);
  return c.json({ object: 'list', data: rows.map(mapInvoice) });
});

invoiceRoutes.get('/invoices/:id', (c) => {
  const merchant = c.get('merchant') as { id: string };
  const row = db.prepare('SELECT * FROM invoices WHERE id = ? AND merchant_id = ?').get(c.req.param('id'), merchant.id);
  if (!row) return c.json({ error: { type: 'invalid_request', message: 'Invoice not found' } }, 404);
  return c.json(mapInvoice(row));
});

invoiceRoutes.post('/invoices/:id/pay', async (c) => {
  const merchant = c.get('merchant') as { id: string };
  const row = db.prepare('SELECT * FROM invoices WHERE id = ? AND merchant_id = ?').get(c.req.param('id'), merchant.id) as any;
  if (!row) return c.json({ error: { type: 'invalid_request', message: 'Invoice not found' } }, 404);
  if (row.status === 'paid') return c.json(mapInvoice(row));
  if (!PAYABLE_STATUSES.has(row.status)) {
    return c.json({
      error: { type: 'invalid_request', message: `Cannot pay invoice with status '${row.status}'` },
    }, 400);
  }

  const paid_at = new Date().toISOString();
  db.prepare('UPDATE invoices SET status = ?, paid_at = ? WHERE id = ?').run('paid', paid_at, row.id);
  const invoice = mapInvoice(db.prepare('SELECT * FROM invoices WHERE id = ?').get(row.id));
  await dispatchWebhook(merchant.id, 'invoice.paid', { object: invoice });
  return c.json(invoice);
});

type SubState = {
  status: string;
  trial_end: string | null;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
};

function persistSubscription(subId: string, advanced: SubState) {
  db.prepare('UPDATE subscriptions SET status = ?, trial_end = ?, current_period_start = ?, current_period_end = ? WHERE id = ?')
    .run(advanced.status, advanced.trial_end, advanced.current_period_start, advanced.current_period_end, subId);
}

export async function processDueInvoices() {
  const now = new Date();
  const subs = db.prepare("SELECT * FROM subscriptions WHERE status IN ('active', 'trialing')").all() as any[];

  for (const sub of subs) {
    const price = db.prepare('SELECT * FROM prices WHERE id = ?').get(sub.price_id) as any;
    let current: SubState = {
      status: sub.status,
      trial_end: sub.trial_end,
      current_period_start: sub.current_period_start,
      current_period_end: sub.current_period_end,
      cancel_at_period_end: intToBool(sub.cancel_at_period_end),
    };

    for (let step = 0; step < MAX_CATCH_UP_PERIODS; step++) {
      const advanced = advanceSubscriptionPeriod(current, price.interval ?? 'month', price.interval_count, now);
      const periodChanged = advanced.current_period_start !== current.current_period_start;
      const statusChanged = advanced.status !== current.status || advanced.trial_end !== current.trial_end;

      if (!periodChanged && !statusChanged) break;

      if (!periodChanged) {
        persistSubscription(sub.id, advanced);
        await dispatchWebhook(sub.merchant_id, 'customer.subscription.updated', { id: sub.id, status: advanced.status });
        current = advanced;
        continue;
      }

      const periodStart = current.current_period_start;
      const periodEnd = current.current_period_end;
      const invoiceId = generateId('invoice');
      const created_at = now.toISOString();
      const lineItems = [];

      if (price.type === 'recurring' && price.unit_amount > 0 && current.status !== 'trialing') {
        lineItems.push(buildSubscriptionLineItem(
          invoiceId,
          price,
          `${periodStart.slice(0, 10)} - ${periodEnd.slice(0, 10)}`,
        ));
      }

      if (price.type === 'metered') {
        const usage = db.prepare('SELECT quantity FROM usage_records WHERE subscription_id = ? AND timestamp >= ? AND timestamp < ?')
          .all(sub.id, periodStart, periodEnd) as { quantity: number }[];
        const summary = summarizeMeteredUsage(usage, price.included_units);
        const meteredItem = buildMeteredLineItem(invoiceId, price, summary.billableQuantity);
        if (meteredItem) lineItems.push(meteredItem);
      }

      const total = sumLineItems(lineItems);
      const webhooks: Array<{ type: string; data: Record<string, unknown> }> = [];

      try {
        const billPeriod = db.transaction(() => {
          if (lineItems.length > 0) {
            db.prepare(`INSERT INTO invoices (id, merchant_id, customer_id, subscription_id, status, subtotal, total, currency, period_start, period_end, paid_at, created_at)
              VALUES (?, ?, ?, ?, 'open', ?, ?, ?, ?, ?, NULL, ?)`)
              .run(invoiceId, sub.merchant_id, sub.customer_id, sub.id, total, total, price.currency, periodStart, periodEnd, created_at);

            const insertLine = db.prepare('INSERT INTO invoice_line_items (id, invoice_id, description, quantity, unit_amount, amount, type) VALUES (?, ?, ?, ?, ?, ?, ?)');
            for (const item of lineItems) {
              insertLine.run(item.id, invoiceId, item.description, item.quantity, item.unit_amount, item.amount, item.type);
            }
          }

          persistSubscription(sub.id, advanced);
        });
        billPeriod();
      } catch (err: any) {
        // Another worker already billed this period.
        if (String(err?.message ?? err).includes('UNIQUE constraint failed')) {
          persistSubscription(sub.id, advanced);
          current = advanced;
          continue;
        }
        throw err;
      }

      if (lineItems.length > 0) {
        webhooks.push({ type: 'invoice.created', data: { id: invoiceId, total } });
      }
      webhooks.push({ type: 'customer.subscription.updated', data: { id: sub.id, status: advanced.status } });

      for (const event of webhooks) {
        await dispatchWebhook(sub.merchant_id, event.type, event.data);
      }

      current = advanced;
      if (current.status === 'canceled') break;
    }
  }
}
