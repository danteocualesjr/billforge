import type { Subscription, SubscriptionStatus } from '@billforge/shared';
import { addDays, addMonths, toIso } from './dates.js';

export interface CreateSubscriptionInput {
  now?: Date;
  trialDays?: number;
  interval?: 'month' | 'year';
  intervalCount?: number;
}

export function computeSubscriptionPeriods(
  start: Date,
  interval: 'month' | 'year' = 'month',
  intervalCount = 1,
): { periodStart: Date; periodEnd: Date } {
  const periodStart = new Date(start);
  const periodEnd = interval === 'year'
    ? addMonths(periodStart, 12 * intervalCount)
    : addMonths(periodStart, intervalCount);
  return { periodStart, periodEnd };
}

export function createSubscriptionState(
  input: CreateSubscriptionInput = {},
): Pick<Subscription, 'status' | 'trial_end' | 'current_period_start' | 'current_period_end' | 'cancel_at_period_end' | 'canceled_at'> {
  const now = input.now ?? new Date();
  const trialDays = input.trialDays ?? 0;
  const interval = input.interval ?? 'month';
  const intervalCount = input.intervalCount ?? 1;

  if (trialDays > 0) {
    const trialEnd = addDays(now, trialDays);
    const { periodStart, periodEnd } = computeSubscriptionPeriods(trialEnd, interval, intervalCount);
    return {
      status: 'trialing',
      trial_end: toIso(trialEnd),
      current_period_start: toIso(periodStart),
      current_period_end: toIso(periodEnd),
      cancel_at_period_end: false,
      canceled_at: null,
    };
  }

  const { periodStart, periodEnd } = computeSubscriptionPeriods(now, interval, intervalCount);
  return {
    status: 'active',
    trial_end: null,
    current_period_start: toIso(periodStart),
    current_period_end: toIso(periodEnd),
    cancel_at_period_end: false,
    canceled_at: null,
  };
}

export function cancelSubscription(
  sub: Pick<Subscription, 'status' | 'cancel_at_period_end' | 'canceled_at'>,
  cancelAtPeriodEnd: boolean,
  now: Date = new Date(),
): Pick<Subscription, 'status' | 'cancel_at_period_end' | 'canceled_at'> {
  if (cancelAtPeriodEnd) {
    return { ...sub, cancel_at_period_end: true, canceled_at: null };
  }
  return { ...sub, status: 'canceled', cancel_at_period_end: false, canceled_at: toIso(now) };
}

export function advanceSubscriptionPeriod(
  sub: Pick<Subscription, 'status' | 'trial_end' | 'current_period_start' | 'current_period_end' | 'cancel_at_period_end'>,
  interval: 'month' | 'year' = 'month',
  intervalCount = 1,
  now: Date = new Date(),
): Pick<Subscription, 'status' | 'trial_end' | 'current_period_start' | 'current_period_end' | 'cancel_at_period_end'> {
  const periodEnd = new Date(sub.current_period_end);
  if (now < periodEnd) return sub;

  if (sub.status === 'trialing' && sub.trial_end && now >= new Date(sub.trial_end)) {
    const start = new Date(sub.trial_end);
    const { periodStart, periodEnd: nextEnd } = computeSubscriptionPeriods(start, interval, intervalCount);
    return {
      ...sub,
      status: sub.cancel_at_period_end ? 'canceled' : 'active',
      trial_end: null,
      current_period_start: toIso(periodStart),
      current_period_end: toIso(nextEnd),
    };
  }

  if (sub.cancel_at_period_end) {
    return { ...sub, status: 'canceled' };
  }

  const nextStart = new Date(sub.current_period_end);
  const { periodStart, periodEnd: nextEnd } = computeSubscriptionPeriods(nextStart, interval, intervalCount);
  return {
    ...sub,
    status: 'active',
    current_period_start: toIso(periodStart),
    current_period_end: toIso(nextEnd),
  };
}

export function isValidStatusTransition(from: SubscriptionStatus, to: SubscriptionStatus): boolean {
  const allowed: Record<SubscriptionStatus, SubscriptionStatus[]> = {
    trialing: ['active', 'canceled'],
    active: ['past_due', 'canceled', 'paused'],
    past_due: ['active', 'canceled'],
    paused: ['active', 'canceled'],
    canceled: [],
  };
  return allowed[from].includes(to);
}
