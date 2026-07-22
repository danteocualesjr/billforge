import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { ensureDemoData } from './seed.js';
import { authMiddleware } from './middleware/auth.js';
import { idempotencyMiddleware } from './middleware/idempotency.js';
import { catalogRoutes } from './routes/catalog.js';
import { subscriptionRoutes } from './routes/subscriptions.js';
import { invoiceRoutes, processDueInvoices } from './routes/invoices.js';
import { usageRoutes } from './routes/usage.js';
import { webhookRoutes } from './routes/webhooks.js';

const app = new Hono();

app.use('*', cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));

app.get('/health', (c) => c.json({ status: 'ok', service: 'billforge-api' }));

const v1 = new Hono();
v1.use('*', authMiddleware);
v1.use('*', idempotencyMiddleware);
v1.route('/', catalogRoutes);
v1.route('/', subscriptionRoutes);
v1.route('/', invoiceRoutes);
v1.route('/', usageRoutes);
v1.route('/', webhookRoutes);

app.route('/v1', v1);

app.post('/internal/process-invoices', async (c) => {
  await processDueInvoices();
  return c.json({ processed: true });
});

const port = Number(process.env.PORT ?? 3001);

const demo = ensureDemoData();
if (demo.seeded) {
  console.log('Seeded demo data. API key:', demo.apiKey);
}

console.log(`BillForge API running on http://localhost:${port}`);

serve({ fetch: app.fetch, port });

setInterval(() => {
  processDueInvoices().catch(console.error);
}, 60_000);
