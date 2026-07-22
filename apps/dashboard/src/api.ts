export { DEMO_API_KEY } from '@billforge/shared';

const API_KEY_STORAGE = 'billforge_api_key';

export function getApiKey(): string {
  return localStorage.getItem(API_KEY_STORAGE) ?? '';
}

export function setApiKey(key: string) {
  localStorage.setItem(API_KEY_STORAGE, key);
}

export function clearApiKey() {
  localStorage.removeItem(API_KEY_STORAGE);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const apiKey = getApiKey();
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
    throw new Error(err.error?.message ?? 'Request failed');
  }
  return res.json();
}

export const api = {
  customers: () => request<{ data: any[] }>('/v1/customers'),
  products: () => request<{ data: any[] }>('/v1/products'),
  prices: () => request<{ data: any[] }>('/v1/prices'),
  subscriptions: () => request<{ data: any[] }>('/v1/subscriptions'),
  invoices: () => request<{ data: any[] }>('/v1/invoices'),
  usage: (subscription?: string) => request<{ data: any[] }>(`/v1/usage_records${subscription ? `?subscription=${subscription}` : ''}`),
  payInvoice: (id: string) => request(`/v1/invoices/${id}/pay`, { method: 'POST' }),
  createSubscription: (body: object) => request('/v1/subscriptions', { method: 'POST', body: JSON.stringify(body) }),
  reportUsage: (body: object) => request('/v1/usage_records', { method: 'POST', body: JSON.stringify(body) }),
};
