import { createHmac } from 'node:crypto';

export function signWebhookPayload(payload: string, secret: string, timestamp: number): string {
  const signedPayload = `${timestamp}.${payload}`;
  const signature = createHmac('sha256', secret).update(signedPayload).digest('hex');
  return `t=${timestamp},v1=${signature}`;
}

export function verifyWebhookSignature(
  payload: string,
  secret: string,
  header: string,
  toleranceSeconds = 300,
): boolean {
  const parts = Object.fromEntries(
    header.split(',').map((part) => {
      const [key, value] = part.split('=');
      return [key, value];
    }),
  ) as { t?: string; v1?: string };

  if (!parts.t || !parts.v1) return false;
  const timestamp = Number(parts.t);
  if (Number.isNaN(timestamp)) return false;

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > toleranceSeconds) return false;

  const expected = createHmac('sha256', secret)
    .update(`${timestamp}.${payload}`)
    .digest('hex');

  return expected === parts.v1;
}
