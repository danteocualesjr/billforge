export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'paused';
export type InvoiceStatus = 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
export type PriceType = 'recurring' | 'metered';
export type BillingInterval = 'month' | 'year';

export interface Merchant { id: string; name: string; api_key: string; webhook_secret: string; created_at: string; }
export interface Customer { id: string; merchant_id: string; email: string; name: string; created_at: string; }
export interface Product { id: string; merchant_id: string; name: string; description: string | null; active: boolean; created_at: string; }
export interface Price {
  id: string; merchant_id: string; product_id: string; nickname: string;
  unit_amount: number; currency: string; type: PriceType;
  interval: BillingInterval | null; interval_count: number; included_units: number;
  active: boolean; created_at: string;
}
export interface Subscription {
  id: string; merchant_id: string; customer_id: string; price_id: string;
  status: SubscriptionStatus; trial_end: string | null;
  current_period_start: string; current_period_end: string;
  cancel_at_period_end: boolean; canceled_at: string | null; created_at: string;
}
export interface InvoiceLineItem {
  id: string; invoice_id: string; description: string;
  quantity: number; unit_amount: number; amount: number;
  type: 'subscription' | 'metered' | 'proration';
}
export interface Invoice {
  id: string; merchant_id: string; customer_id: string; subscription_id: string;
  status: InvoiceStatus; subtotal: number; total: number; currency: string;
  period_start: string; period_end: string; paid_at: string | null;
  created_at: string; line_items: InvoiceLineItem[];
}
export interface UsageRecord {
  id: string; merchant_id: string; subscription_id: string;
  quantity: number; timestamp: string; created_at: string;
}
export interface WebhookEndpoint {
  id: string; merchant_id: string; url: string; secret: string; enabled: boolean; created_at: string;
}
export interface WebhookEvent { id: string; type: string; created_at: string; data: Record<string, unknown>; }
