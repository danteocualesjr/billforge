import { describe, it, expect } from 'vitest';
import { createSubscriptionState, cancelSubscription, advanceSubscriptionPeriod } from './subscriptions.js';

describe('subscriptions', () => {
  it('creates trialing subscription', () => {
    const state = createSubscriptionState({ now: new Date('2026-01-01'), trialDays: 14 });
    expect(state.status).toBe('trialing');
    expect(state.trial_end).toBe('2026-01-15T00:00:00.000Z');
  });

  it('creates active subscription without trial', () => {
    const state = createSubscriptionState({ now: new Date('2026-01-01') });
    expect(state.status).toBe('active');
    expect(state.trial_end).toBeNull();
  });

  it('cancels immediately', () => {
    const base = createSubscriptionState({ now: new Date('2026-01-01') });
    const canceled = cancelSubscription(base, false, new Date('2026-01-10'));
    expect(canceled.status).toBe('canceled');
    expect(canceled.canceled_at).toBe('2026-01-10T00:00:00.000Z');
  });

  it('activates a trialing subscription when trial_end passes', () => {
    const created = createSubscriptionState({ now: new Date('2026-01-01T00:00:00.000Z'), trialDays: 14 });
    const advanced = advanceSubscriptionPeriod(
      created,
      'month',
      1,
      new Date('2026-01-15T00:00:00.000Z'),
    );
    expect(advanced.status).toBe('active');
    expect(advanced.trial_end).toBeNull();
    expect(advanced.current_period_start).toBe(created.current_period_start);
    expect(advanced.current_period_end).toBe(created.current_period_end);
  });

  it('keeps trialing status before trial_end', () => {
    const created = createSubscriptionState({ now: new Date('2026-01-01T00:00:00.000Z'), trialDays: 14 });
    const advanced = advanceSubscriptionPeriod(
      created,
      'month',
      1,
      new Date('2026-01-10T00:00:00.000Z'),
    );
    expect(advanced.status).toBe('trialing');
    expect(advanced.trial_end).toBe(created.trial_end);
  });
});
