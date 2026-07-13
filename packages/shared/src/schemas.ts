import { z } from 'zod';
export const createCustomerSchema = z.object({ email: z.string().email(), name: z.string().min(1) });
export const createProductSchema = z.object({ name: z.string().min(1), description: z.string().optional() });
export const createPriceSchema = z.object({
  product: z.string().min(1), nickname: z.string().min(1),
  unit_amount: z.number().int().nonnegative(), currency: z.string().default('usd'),
  type: z.enum(['recurring', 'metered']).default('recurring'),
  interval: z.enum(['month', 'year']).optional(),
  interval_count: z.number().int().positive().default(1),
  included_units: z.number().int().nonnegative().default(0),
});
export const createSubscriptionSchema = z.object({
  customer: z.string().min(1), price: z.string().min(1),
  trial_days: z.number().int().nonnegative().optional(),
});
export const cancelSubscriptionSchema = z.object({ cancel_at_period_end: z.boolean().default(true) });
export const createUsageRecordSchema = z.object({
  subscription: z.string().min(1), quantity: z.number().positive(),
  timestamp: z.string().datetime().optional(),
});
export const changeSubscriptionPriceSchema = z.object({ price: z.string().min(1) });
export const createWebhookEndpointSchema = z.object({ url: z.string().url() });
