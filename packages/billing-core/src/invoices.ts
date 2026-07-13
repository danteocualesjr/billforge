import type { InvoiceLineItem, Price } from '@billforge/shared';
import { generateId } from '@billforge/shared';

export interface MeteredUsageSummary {
  totalQuantity: number;
  billableQuantity: number;
}

export function summarizeMeteredUsage(
  records: { quantity: number }[],
  includedUnits: number,
): MeteredUsageSummary {
  const totalQuantity = records.reduce((sum, r) => sum + r.quantity, 0);
  const billableQuantity = Math.max(0, totalQuantity - includedUnits);
  return { totalQuantity, billableQuantity };
}

export function buildSubscriptionLineItem(
  invoiceId: string,
  price: Pick<Price, 'nickname' | 'unit_amount'>,
  periodLabel: string,
): InvoiceLineItem {
  const amount = price.unit_amount;
  return {
    id: generateId('line_item'),
    invoice_id: invoiceId,
    description: `${price.nickname} (${periodLabel})`,
    quantity: 1,
    unit_amount: price.unit_amount,
    amount,
    type: 'subscription',
  };
}

export function buildMeteredLineItem(
  invoiceId: string,
  price: Pick<Price, 'nickname' | 'unit_amount'>,
  billableQuantity: number,
): InvoiceLineItem | null {
  if (billableQuantity <= 0) return null;
  const amount = Math.round(billableQuantity * price.unit_amount);
  return {
    id: generateId('line_item'),
    invoice_id: invoiceId,
    description: `${price.nickname} (metered usage)`,
    quantity: billableQuantity,
    unit_amount: price.unit_amount,
    amount,
    type: 'metered',
  };
}

export function sumLineItems(lineItems: InvoiceLineItem[]): number {
  return lineItems.reduce((sum, item) => sum + item.amount, 0);
}
