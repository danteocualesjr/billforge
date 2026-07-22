import { buildDemoDataset, DEMO_API_KEY } from '@billforge/shared';
import { db } from './db/index.js';

export { DEMO_API_KEY };

export function seedDatabase() {
  const data = buildDemoDataset();

  db.prepare('DELETE FROM invoice_line_items').run();
  db.prepare('DELETE FROM invoices').run();
  db.prepare('DELETE FROM usage_records').run();
  db.prepare('DELETE FROM subscriptions').run();
  db.prepare('DELETE FROM prices').run();
  db.prepare('DELETE FROM products').run();
  db.prepare('DELETE FROM customers').run();
  db.prepare('DELETE FROM webhook_endpoints').run();
  db.prepare('DELETE FROM idempotency_keys').run();
  db.prepare('DELETE FROM merchants').run();

  const webhookSecret = 'whsec_' + crypto.randomUUID().replace(/-/g, '');
  db.prepare('INSERT INTO merchants (id, name, api_key, webhook_secret, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(data.customers[0].merchant_id, 'Acme Inc.', DEMO_API_KEY, webhookSecret, data.products[0].created_at);

  for (const product of data.products) {
    db.prepare('INSERT INTO products (id, merchant_id, name, description, active, created_at) VALUES (?, ?, ?, ?, 1, ?)')
      .run(product.id, product.merchant_id, product.name, product.description, product.created_at);
  }

  for (const price of data.prices) {
    db.prepare(`INSERT INTO prices (id, merchant_id, product_id, nickname, unit_amount, currency, type, interval, interval_count, included_units, active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`)
      .run(
        price.id,
        price.merchant_id,
        price.product_id,
        price.nickname,
        price.unit_amount,
        price.currency,
        price.type,
        price.interval,
        price.interval_count,
        price.included_units,
        price.created_at,
      );
  }

  for (const customer of data.customers) {
    db.prepare('INSERT INTO customers (id, merchant_id, email, name, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(customer.id, customer.merchant_id, customer.email, customer.name, customer.created_at);
  }

  for (const sub of data.subscriptions) {
    db.prepare(`INSERT INTO subscriptions
      (id, merchant_id, customer_id, price_id, status, trial_end, current_period_start, current_period_end, cancel_at_period_end, canceled_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, ?)`)
      .run(
        sub.id,
        sub.merchant_id,
        sub.customer_id,
        sub.price_id,
        sub.status,
        sub.trial_end,
        sub.current_period_start,
        sub.current_period_end,
        sub.created_at,
      );
  }

  const insertInvoice = db.prepare(`INSERT INTO invoices
    (id, merchant_id, customer_id, subscription_id, status, subtotal, total, currency, period_start, period_end, paid_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  const insertLineItem = db.prepare(
    'INSERT INTO invoice_line_items (id, invoice_id, description, quantity, unit_amount, amount, type) VALUES (?, ?, ?, ?, ?, ?, ?)',
  );

  for (const invoice of data.invoices) {
    insertInvoice.run(
      invoice.id,
      invoice.merchant_id,
      invoice.customer_id,
      invoice.subscription_id,
      invoice.status,
      invoice.subtotal,
      invoice.total,
      invoice.currency,
      invoice.period_start,
      invoice.period_end,
      invoice.paid_at,
      invoice.created_at,
    );

    insertLineItem.run(
      `li_${invoice.id}`,
      invoice.id,
      `Subscription (${invoice.period_start.slice(0, 10)} – ${invoice.period_end.slice(0, 10)})`,
      1,
      invoice.total,
      invoice.total,
      'subscription',
    );
  }

  for (const record of data.usage) {
    db.prepare('INSERT INTO usage_records (id, merchant_id, subscription_id, quantity, timestamp, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(record.id, record.merchant_id, record.subscription_id, record.quantity, record.timestamp, record.created_at);
  }

  db.prepare('INSERT INTO webhook_endpoints (id, merchant_id, url, secret, enabled, created_at) VALUES (?, ?, ?, ?, 1, ?)')
    .run('we_demo0001', data.customers[0].merchant_id, 'https://example.com/webhooks/billforge', webhookSecret, data.products[0].created_at);

  const activeSubs = data.subscriptions.filter((s) => s.status === 'active' || s.status === 'trialing').length;
  const unpaidInvoices = data.invoices.filter((i) => i.status === 'open' || i.status === 'past_due').length;
  const totalUsage = data.usage.reduce((sum, u) => sum + u.quantity, 0);
  const mrr = data.subscriptions
    .filter((s) => s.status === 'active' || s.status === 'trialing')
    .reduce((sum, s) => {
      const price = data.prices.find((p) => p.id === s.price_id);
      return sum + (price?.type === 'recurring' ? price.unit_amount : 0);
    }, 0);

  return {
    apiKey: DEMO_API_KEY,
    merchantName: 'Acme Inc.',
    customers: data.customers.length,
    subscriptions: data.subscriptions.length,
    activeSubscriptions: activeSubs,
    invoices: data.invoices.length,
    openInvoices: unpaidInvoices,
    products: data.products.length,
    usageUnits: totalUsage,
    mrr,
  };
}

export function ensureDemoData() {
  const existing = db.prepare('SELECT id FROM merchants WHERE api_key = ?').get(DEMO_API_KEY);
  if (existing) return { seeded: false, apiKey: DEMO_API_KEY };
  return { seeded: true, ...seedDatabase() };
}

const isDirectRun = process.argv[1]?.includes('seed');

if (isDirectRun) {
  const stats = seedDatabase();
  console.log('\n=== BillForge Seed Complete ===');
  console.log('API Key:', stats.apiKey);
  console.log('Merchant:', stats.merchantName);
  console.log('');
  console.log('Sample data:');
  console.log(`  ${stats.customers.toLocaleString()} customers`);
  console.log(`  ${stats.subscriptions} subscriptions (${stats.activeSubscriptions} active/trialing)`);
  console.log(`  ${stats.invoices} invoices (${stats.openInvoices} open or past due)`);
  console.log(`  ${stats.products} products`);
  console.log(`  ${stats.usageUnits.toLocaleString()} usage units`);
  console.log(`  ~${(stats.mrr / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} MRR`);
  console.log('\nUse: Authorization: Bearer', stats.apiKey);
}
