import { generateId } from '@billforge/shared';
import { signWebhookPayload } from '@billforge/billing-core';
import { db } from '../db/index.js';

const WEBHOOK_TIMEOUT_MS = 10_000;

export async function dispatchWebhook(merchantId: string, type: string, data: Record<string, unknown>) {
  const endpoints = db.prepare('SELECT * FROM webhook_endpoints WHERE merchant_id = ? AND enabled = 1').all(merchantId) as any[];
  const merchant = db.prepare('SELECT webhook_secret FROM merchants WHERE id = ?').get(merchantId) as { webhook_secret: string };
  const event = { id: generateId('event'), type, created_at: new Date().toISOString(), data };

  for (const endpoint of endpoints) {
    const payload = JSON.stringify(event);
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = signWebhookPayload(payload, endpoint.secret || merchant.webhook_secret, timestamp);
    try {
      await fetch(endpoint.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'BillForge-Signature': signature },
        body: payload,
        signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
        redirect: 'error',
      });
    } catch { /* best-effort */ }
  }
}
