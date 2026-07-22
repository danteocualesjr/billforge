import { generateId } from '@billforge/shared';
import { db } from './db/index.js';

const DEMO_API_KEY = 'bf_test_demo00000000000000000001';

function daysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function daysFromNow(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function monthsAgo(months: number) {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toISOString();
}

const CUSTOMERS = [
  { name: 'Globex Corp', email: 'billing@globex.io', createdDaysAgo: 420 },
  { name: 'Acme Cloud', email: 'finance@acmecloud.com', createdDaysAgo: 380 },
  { name: 'NovaTech', email: 'accounts@novatech.dev', createdDaysAgo: 310 },
  { name: 'Pixel Labs', email: 'ap@pixellabs.co', createdDaysAgo: 240 },
  { name: 'Horizon AI', email: 'billing@horizon.ai', createdDaysAgo: 190 },
  { name: 'Stellar Systems', email: 'payables@stellar.io', createdDaysAgo: 165 },
  { name: 'Northwind Digital', email: 'billing@northwind.dev', createdDaysAgo: 140 },
  { name: 'BluePeak Analytics', email: 'finance@bluepeak.com', createdDaysAgo: 120 },
  { name: 'Cascade Software', email: 'ap@cascade.io', createdDaysAgo: 95 },
  { name: 'Vertex Labs', email: 'billing@vertexlabs.co', createdDaysAgo: 72 },
  { name: 'Summit Health', email: 'finance@summithealth.org', createdDaysAgo: 58 },
  { name: 'Orbit Media', email: 'accounts@orbitmedia.tv', createdDaysAgo: 45 },
  { name: 'Forge Robotics', email: 'billing@forgerobotics.com', createdDaysAgo: 32 },
  { name: 'Lumen Data', email: 'ap@lumendata.io', createdDaysAgo: 21 },
  { name: 'Atlas Commerce', email: 'billing@atlascommerce.com', createdDaysAgo: 14 },
  { name: 'Prism Design', email: 'finance@prismdesign.co', createdDaysAgo: 9 },
  { name: 'Echo Networks', email: 'payables@echonetworks.net', createdDaysAgo: 6 },
  { name: 'Quanta Bio', email: 'billing@quantabio.com', createdDaysAgo: 4 },
  { name: 'Relay Financial', email: 'ap@relay.financial', createdDaysAgo: 2 },
  { name: 'Nimbus Works', email: 'billing@nimbus.works', createdDaysAgo: 1 },
];

const PRODUCTS = [
  { name: 'BillForge Platform', description: 'Core subscription billing and invoicing' },
  { name: 'API Gateway', description: 'Managed API gateway with rate limiting' },
  { name: 'Analytics Suite', description: 'Usage analytics and revenue reporting' },
  { name: 'SSO & Security', description: 'Enterprise SSO, audit logs, and RBAC' },
  { name: 'White-label Portal', description: 'Branded customer billing portal' },
  { name: 'Priority Support', description: '24/7 priority support and SLA' },
];

const PLAN_PRICES = [
  { nickname: 'Starter', unit_amount: 4900, type: 'recurring' as const, interval: 'month' as const },
  { nickname: 'Growth', unit_amount: 29900, type: 'recurring' as const, interval: 'month' as const },
  { nickname: 'Scale', unit_amount: 89900, type: 'recurring' as const, interval: 'month' as const },
  { nickname: 'Enterprise', unit_amount: 450000, type: 'recurring' as const, interval: 'month' as const },
  { nickname: 'API Calls', unit_amount: 20, type: 'metered' as const, interval: null, included_units: 1000 },
];

type SubSeed = {
  customerIndex: number;
  plan: 'Starter' | 'Growth' | 'Scale' | 'Enterprise';
  status: 'active' | 'trialing' | 'past_due' | 'canceled';
  createdDaysAgo: number;
  periodEndDaysFromNow: number;
};

const SUBSCRIPTIONS: SubSeed[] = [
  { customerIndex: 0, plan: 'Enterprise', status: 'active', createdDaysAgo: 400, periodEndDaysFromNow: 18 },
  { customerIndex: 1, plan: 'Scale', status: 'active', createdDaysAgo: 360, periodEndDaysFromNow: 12 },
  { customerIndex: 2, plan: 'Growth', status: 'active', createdDaysAgo: 300, periodEndDaysFromNow: 22 },
  { customerIndex: 3, plan: 'Growth', status: 'active', createdDaysAgo: 220, periodEndDaysFromNow: 8 },
  { customerIndex: 4, plan: 'Starter', status: 'active', createdDaysAgo: 180, periodEndDaysFromNow: 25 },
  { customerIndex: 5, plan: 'Enterprise', status: 'active', createdDaysAgo: 150, periodEndDaysFromNow: 14 },
  { customerIndex: 6, plan: 'Scale', status: 'active', createdDaysAgo: 130, periodEndDaysFromNow: 6 },
  { customerIndex: 7, plan: 'Growth', status: 'trialing', createdDaysAgo: 10, periodEndDaysFromNow: 20 },
  { customerIndex: 8, plan: 'Scale', status: 'active', createdDaysAgo: 90, periodEndDaysFromNow: 11 },
  { customerIndex: 9, plan: 'Enterprise', status: 'active', createdDaysAgo: 70, periodEndDaysFromNow: 19 },
  { customerIndex: 10, plan: 'Starter', status: 'active', createdDaysAgo: 55, periodEndDaysFromNow: 16 },
  { customerIndex: 11, plan: 'Growth', status: 'active', createdDaysAgo: 40, periodEndDaysFromNow: 9 },
  { customerIndex: 12, plan: 'Scale', status: 'past_due', createdDaysAgo: 100, periodEndDaysFromNow: -5 },
  { customerIndex: 13, plan: 'Starter', status: 'active', createdDaysAgo: 18, periodEndDaysFromNow: 28 },
  { customerIndex: 14, plan: 'Enterprise', status: 'active', createdDaysAgo: 12, periodEndDaysFromNow: 15 },
  { customerIndex: 15, plan: 'Growth', status: 'canceled', createdDaysAgo: 200, periodEndDaysFromNow: -30 },
  { customerIndex: 16, plan: 'Starter', status: 'active', createdDaysAgo: 5, periodEndDaysFromNow: 24 },
  { customerIndex: 17, plan: 'Scale', status: 'active', createdDaysAgo: 3, periodEndDaysFromNow: 27 },
];

type InvoiceSeed = {
  customerIndex: number;
  subIndex: number;
  status: 'paid' | 'open' | 'past_due' | 'draft';
  totalCents: number;
  createdDaysAgo: number;
  periodDaysAgo: number;
};

const INVOICES: InvoiceSeed[] = [
  { customerIndex: 0, subIndex: 0, status: 'paid', totalCents: 450000, createdDaysAgo: 35, periodDaysAgo: 65 },
  { customerIndex: 1, subIndex: 1, status: 'paid', totalCents: 89900, createdDaysAgo: 32, periodDaysAgo: 62 },
  { customerIndex: 2, subIndex: 2, status: 'open', totalCents: 29900, createdDaysAgo: 8, periodDaysAgo: 38 },
  { customerIndex: 3, subIndex: 3, status: 'paid', totalCents: 29900, createdDaysAgo: 28, periodDaysAgo: 58 },
  { customerIndex: 4, subIndex: 4, status: 'paid', totalCents: 4900, createdDaysAgo: 25, periodDaysAgo: 55 },
  { customerIndex: 5, subIndex: 5, status: 'open', totalCents: 450000, createdDaysAgo: 6, periodDaysAgo: 36 },
  { customerIndex: 6, subIndex: 6, status: 'paid', totalCents: 89900, createdDaysAgo: 22, periodDaysAgo: 52 },
  { customerIndex: 8, subIndex: 8, status: 'past_due', totalCents: 89900, createdDaysAgo: 18, periodDaysAgo: 48 },
  { customerIndex: 9, subIndex: 9, status: 'paid', totalCents: 450000, createdDaysAgo: 15, periodDaysAgo: 45 },
  { customerIndex: 10, subIndex: 10, status: 'open', totalCents: 4900, createdDaysAgo: 4, periodDaysAgo: 34 },
  { customerIndex: 11, subIndex: 11, status: 'paid', totalCents: 29900, createdDaysAgo: 12, periodDaysAgo: 42 },
  { customerIndex: 12, subIndex: 12, status: 'past_due', totalCents: 89900, createdDaysAgo: 14, periodDaysAgo: 44 },
  { customerIndex: 13, subIndex: 13, status: 'paid', totalCents: 4900, createdDaysAgo: 10, periodDaysAgo: 40 },
  { customerIndex: 14, subIndex: 14, status: 'open', totalCents: 450000, createdDaysAgo: 3, periodDaysAgo: 33 },
  { customerIndex: 0, subIndex: 0, status: 'paid', totalCents: 450000, createdDaysAgo: 65, periodDaysAgo: 95 },
  { customerIndex: 1, subIndex: 1, status: 'paid', totalCents: 89900, createdDaysAgo: 62, periodDaysAgo: 92 },
  { customerIndex: 2, subIndex: 2, status: 'paid', totalCents: 29900, createdDaysAgo: 58, periodDaysAgo: 88 },
  { customerIndex: 5, subIndex: 5, status: 'paid', totalCents: 450000, createdDaysAgo: 95, periodDaysAgo: 125 },
  { customerIndex: 6, subIndex: 6, status: 'open', totalCents: 89900, createdDaysAgo: 2, periodDaysAgo: 32 },
  { customerIndex: 9, subIndex: 9, status: 'past_due', totalCents: 450000, createdDaysAgo: 20, periodDaysAgo: 50 },
  { customerIndex: 16, subIndex: 16, status: 'draft', totalCents: 4900, createdDaysAgo: 1, periodDaysAgo: 31 },
  { customerIndex: 17, subIndex: 17, status: 'open', totalCents: 89900, createdDaysAgo: 5, periodDaysAgo: 35 },
  { customerIndex: 4, subIndex: 4, status: 'paid', totalCents: 4900, createdDaysAgo: 85, periodDaysAgo: 115 },
];

// Clear existing data
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

const merchantId = generateId('merchant');
const webhookSecret = 'whsec_' + crypto.randomUUID().replace(/-/g, '');
db.prepare('INSERT INTO merchants (id, name, api_key, webhook_secret, created_at) VALUES (?, ?, ?, ?, ?)')
  .run(merchantId, 'Acme Inc.', DEMO_API_KEY, webhookSecret, monthsAgo(14));

const productIds: string[] = [];
for (const product of PRODUCTS) {
  const id = generateId('product');
  productIds.push(id);
  db.prepare('INSERT INTO products (id, merchant_id, name, description, active, created_at) VALUES (?, ?, ?, ?, 1, ?)')
    .run(id, merchantId, product.name, product.description, monthsAgo(12));
}

const mainProductId = productIds[0];
const priceByNickname = new Map<string, string>();

for (const plan of PLAN_PRICES) {
  const id = generateId('price');
  priceByNickname.set(plan.nickname, id);
  db.prepare(`INSERT INTO prices (id, merchant_id, product_id, nickname, unit_amount, currency, type, interval, interval_count, included_units, active, created_at)
    VALUES (?, ?, ?, ?, ?, 'usd', ?, ?, 1, ?, 1, ?)`)
    .run(
      id,
      merchantId,
      mainProductId,
      plan.nickname,
      plan.unit_amount,
      plan.type,
      plan.interval,
      plan.included_units ?? 0,
      monthsAgo(12),
    );
}

// Add a price on each add-on product for catalog variety
for (let i = 1; i < productIds.length; i++) {
  const id = generateId('price');
  db.prepare(`INSERT INTO prices (id, merchant_id, product_id, nickname, unit_amount, currency, type, interval, interval_count, included_units, active, created_at)
    VALUES (?, ?, ?, ?, ?, 'usd', 'recurring', 'month', 1, 0, 1, ?)`)
    .run(id, merchantId, productIds[i], 'Standard', [9900, 14900, 7900, 19900, 4900][i - 1], monthsAgo(10));
}

const customerIds: string[] = [];
for (const customer of CUSTOMERS) {
  const id = generateId('customer');
  customerIds.push(id);
  db.prepare('INSERT INTO customers (id, merchant_id, email, name, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(id, merchantId, customer.email, customer.name, daysAgo(customer.createdDaysAgo));
}

const subscriptionIds: string[] = [];
for (const sub of SUBSCRIPTIONS) {
  const id = generateId('subscription');
  subscriptionIds.push(id);
  const priceId = priceByNickname.get(sub.plan)!;
  const createdAt = daysAgo(sub.createdDaysAgo);
  const periodStart = daysAgo(Math.max(sub.createdDaysAgo - 30, 1));
  const periodEnd = sub.periodEndDaysFromNow >= 0
    ? daysFromNow(sub.periodEndDaysFromNow)
    : daysAgo(-sub.periodEndDaysFromNow);

  db.prepare(`INSERT INTO subscriptions
    (id, merchant_id, customer_id, price_id, status, trial_end, current_period_start, current_period_end, cancel_at_period_end, canceled_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(
      id,
      merchantId,
      customerIds[sub.customerIndex],
      priceId,
      sub.status,
      sub.status === 'trialing' ? periodEnd : null,
      periodStart,
      periodEnd,
      sub.status === 'canceled' ? 1 : 0,
      sub.status === 'canceled' ? daysAgo(30) : null,
      createdAt,
    );
}

const insertInvoice = db.prepare(`INSERT INTO invoices
  (id, merchant_id, customer_id, subscription_id, status, subtotal, total, currency, period_start, period_end, paid_at, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, 'usd', ?, ?, ?, ?)`);

const insertLineItem = db.prepare(
  'INSERT INTO invoice_line_items (id, invoice_id, description, quantity, unit_amount, amount, type) VALUES (?, ?, ?, ?, ?, ?, ?)',
);

for (const inv of INVOICES) {
  const id = generateId('invoice');
  const customerId = customerIds[inv.customerIndex];
  const subscriptionId = subscriptionIds[inv.subIndex];
  const createdAt = daysAgo(inv.createdDaysAgo);
  const periodStart = daysAgo(inv.periodDaysAgo);
  const periodEnd = daysAgo(inv.periodDaysAgo - 30);
  const paidAt = inv.status === 'paid' ? createdAt : null;

  insertInvoice.run(
    id,
    merchantId,
    customerId,
    subscriptionId,
    inv.status,
    inv.totalCents,
    inv.totalCents,
    periodStart,
    periodEnd,
    paidAt,
    createdAt,
  );

  insertLineItem.run(
    generateId('line_item'),
    id,
    `Subscription (${periodStart.slice(0, 10)} – ${periodEnd.slice(0, 10)})`,
    1,
    inv.totalCents,
    inv.totalCents,
    'subscription',
  );
}

const insertUsage = db.prepare(
  'INSERT INTO usage_records (id, merchant_id, subscription_id, quantity, timestamp, created_at) VALUES (?, ?, ?, ?, ?, ?)',
);

const usageTargets = [
  { subIndex: 0, quantity: 185000, daysAgo: 2 },
  { subIndex: 1, quantity: 142000, daysAgo: 3 },
  { subIndex: 2, quantity: 98000, daysAgo: 1 },
  { subIndex: 3, quantity: 76000, daysAgo: 4 },
  { subIndex: 5, quantity: 210000, daysAgo: 2 },
  { subIndex: 6, quantity: 88000, daysAgo: 5 },
  { subIndex: 8, quantity: 124000, daysAgo: 1 },
  { subIndex: 9, quantity: 156000, daysAgo: 3 },
  { subIndex: 11, quantity: 54000, daysAgo: 6 },
  { subIndex: 14, quantity: 92000, daysAgo: 2 },
  { subIndex: 16, quantity: 31000, daysAgo: 1 },
  { subIndex: 17, quantity: 67000, daysAgo: 4 },
];

for (const usage of usageTargets) {
  const ts = daysAgo(usage.daysAgo);
  insertUsage.run(generateId('usage'), merchantId, subscriptionIds[usage.subIndex], usage.quantity, ts, ts);
}

const webhookId = generateId('webhook');
db.prepare('INSERT INTO webhook_endpoints (id, merchant_id, url, secret, enabled, created_at) VALUES (?, ?, ?, ?, 1, ?)')
  .run(webhookId, merchantId, 'https://example.com/webhooks/billforge', webhookSecret, monthsAgo(6));

const activeSubs = SUBSCRIPTIONS.filter((s) => s.status === 'active' || s.status === 'trialing').length;
const openInvoices = INVOICES.filter((i) => i.status === 'open' || i.status === 'past_due').length;
const totalUsage = usageTargets.reduce((sum, u) => sum + u.quantity, 0);
const mrr = SUBSCRIPTIONS
  .filter((s) => s.status === 'active' || s.status === 'trialing')
  .reduce((sum, s) => sum + (PLAN_PRICES.find((p) => p.nickname === s.plan)?.unit_amount ?? 0), 0);

console.log('\n=== BillForge Seed Complete ===');
console.log('API Key:', DEMO_API_KEY);
console.log('Merchant:', 'Acme Inc.');
console.log('');
console.log('Sample data:');
console.log(`  ${CUSTOMERS.length} customers`);
console.log(`  ${SUBSCRIPTIONS.length} subscriptions (${activeSubs} active/trialing)`);
console.log(`  ${INVOICES.length} invoices (${openInvoices} open or past due)`);
console.log(`  ${PRODUCTS.length} products`);
console.log(`  ${totalUsage.toLocaleString()} usage units`);
console.log(`  ~${(mrr / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} MRR`);
console.log('\nUse: Authorization: Bearer', DEMO_API_KEY);
