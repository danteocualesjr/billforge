import { generateId } from '@billforge/shared';
import { db } from './db/index.js';

const merchantId = generateId('merchant');
const apiKey = 'bf_test_' + crypto.randomUUID().replace(/-/g, '');
const webhookSecret = 'whsec_' + crypto.randomUUID().replace(/-/g, '');
const now = new Date().toISOString();

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

db.prepare('INSERT INTO merchants (id, name, api_key, webhook_secret, created_at) VALUES (?, ?, ?, ?, ?)')
  .run(merchantId, 'Demo Merchant', apiKey, webhookSecret, now);

const productId = generateId('product');
db.prepare('INSERT INTO products (id, merchant_id, name, description, active, created_at) VALUES (?, ?, ?, ?, 1, ?)')
  .run(productId, merchantId, 'API Platform', 'Usage-based API billing platform', now);

const starterPrice = generateId('price');
const proPrice = generateId('price');
db.prepare(`INSERT INTO prices (id, merchant_id, product_id, nickname, unit_amount, currency, type, interval, interval_count, included_units, active, created_at) VALUES (?, ?, ?, ?, ?, 'usd', 'metered', NULL, 1, 1000, 1, ?)`)
  .run(starterPrice, merchantId, productId, 'Starter', 0, now);
db.prepare(`INSERT INTO prices (id, merchant_id, product_id, nickname, unit_amount, currency, type, interval, interval_count, included_units, active, created_at) VALUES (?, ?, ?, ?, ?, 'usd', 'recurring', 'month', 1, 0, 1, ?)`)
  .run(proPrice, merchantId, productId, 'Pro', 4900, now);
db.prepare(`INSERT INTO prices (id, merchant_id, product_id, nickname, unit_amount, currency, type, interval, interval_count, included_units, active, created_at) VALUES (?, ?, ?, ?, ?, 'usd', 'metered', NULL, 1, 0, 1, ?)`)
  .run(generateId('price'), merchantId, productId, 'Pro API Calls', 0.2, now);

const customerId = generateId('customer');
db.prepare('INSERT INTO customers (id, merchant_id, email, name, created_at) VALUES (?, ?, ?, ?, ?)')
  .run(customerId, merchantId, 'demo@example.com', 'Demo Customer', now);

console.log('\n=== BillForge Seed Complete ===');
console.log('API Key:', apiKey);
console.log('Merchant ID:', merchantId);
console.log('Product ID:', productId);
console.log('Pro Price ID:', proPrice);
console.log('Customer ID:', customerId);
console.log('\nUse: Authorization: Bearer', apiKey);
