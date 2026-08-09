import type { Context, Next } from 'hono';
import { db } from '../db/index.js';

type StoredResponse =
  | { status: 'pending' }
  | { status: number; body: unknown };

function replay(c: Context, raw: string) {
  const parsed = JSON.parse(raw) as StoredResponse | unknown;
  if (parsed && typeof parsed === 'object' && 'status' in parsed) {
    const stored = parsed as StoredResponse;
    if (stored.status === 'pending') {
      return c.json({
        error: { type: 'idempotency_error', message: 'Request with this Idempotency-Key is already in progress' },
      }, 409);
    }
    if ('body' in stored) {
      return c.json(stored.body as object, stored.status as 200);
    }
  }
  return c.json(parsed as object);
}

export async function idempotencyMiddleware(c: Context, next: Next) {
  const key = c.req.header('Idempotency-Key');
  if (!key) {
    await next();
    return;
  }

  const merchant = c.get('merchant') as { id: string };
  const existing = db.prepare('SELECT response FROM idempotency_keys WHERE key = ? AND merchant_id = ?')
    .get(key, merchant.id) as { response: string } | undefined;

  if (existing) {
    return replay(c, existing.response);
  }

  try {
    db.prepare('INSERT INTO idempotency_keys (key, merchant_id, response, created_at) VALUES (?, ?, ?, ?)')
      .run(key, merchant.id, JSON.stringify({ status: 'pending' }), new Date().toISOString());
  } catch {
    const raced = db.prepare('SELECT response FROM idempotency_keys WHERE key = ? AND merchant_id = ?')
      .get(key, merchant.id) as { response: string } | undefined;
    if (raced) return replay(c, raced.response);
    throw new Error('Failed to reserve idempotency key');
  }

  await next();

  if (c.res.status < 400) {
    const cloned = c.res.clone();
    const body = await cloned.json();
    db.prepare('UPDATE idempotency_keys SET response = ? WHERE key = ? AND merchant_id = ?')
      .run(JSON.stringify({ status: c.res.status, body }), key, merchant.id);
  } else {
    // Allow clients to retry failed requests with the same key.
    db.prepare('DELETE FROM idempotency_keys WHERE key = ? AND merchant_id = ?').run(key, merchant.id);
  }
}
