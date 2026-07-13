import type { InvoiceLineItem } from '@billforge/shared';
import { generateId } from '@billforge/shared';
import { fractionRemaining } from './dates.js';

export function calculateProrationCredit(
  oldUnitAmount: number,
  periodStart: Date,
  periodEnd: Date,
  changeAt: Date,
): number {
  const fraction = fractionRemaining(periodStart, periodEnd, changeAt);
  return -Math.round(oldUnitAmount * fraction);
}

export function calculateProrationCharge(
  newUnitAmount: number,
  periodStart: Date,
  periodEnd: Date,
  changeAt: Date,
): number {
  const fraction = fractionRemaining(periodStart, periodEnd, changeAt);
  return Math.round(newUnitAmount * fraction);
}

export function buildProrationLineItems(
  invoiceId: string,
  oldNickname: string,
  newNickname: string,
  oldUnitAmount: number,
  newUnitAmount: number,
  periodStart: Date,
  periodEnd: Date,
  changeAt: Date,
): InvoiceLineItem[] {
  const credit = calculateProrationCredit(oldUnitAmount, periodStart, periodEnd, changeAt);
  const charge = calculateProrationCharge(newUnitAmount, periodStart, periodEnd, changeAt);
  const items: InvoiceLineItem[] = [];

  if (credit !== 0) {
    items.push({
      id: generateId('line_item'),
      invoice_id: invoiceId,
      description: `Unused time on ${oldNickname}`,
      quantity: 1,
      unit_amount: credit,
      amount: credit,
      type: 'proration',
    });
  }

  if (charge !== 0) {
    items.push({
      id: generateId('line_item'),
      invoice_id: invoiceId,
      description: `Remaining time on ${newNickname}`,
      quantity: 1,
      unit_amount: charge,
      amount: charge,
      type: 'proration',
    });
  }

  return items;
}
