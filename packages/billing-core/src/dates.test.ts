import { describe, it, expect } from 'vitest';
import { addMonths } from './dates.js';

function ymd(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

describe('addMonths', () => {
  it('advances a mid-month date by one month', () => {
    expect(ymd(addMonths(new Date(2026, 0, 15), 1))).toBe('2026-02-15');
  });

  it('clamps month-end dates instead of overflowing', () => {
    expect(ymd(addMonths(new Date(2026, 0, 31), 1))).toBe('2026-02-28');
  });

  it('preserves Feb 29 on leap years when landing in February', () => {
    expect(ymd(addMonths(new Date(2024, 0, 31), 1))).toBe('2024-02-29');
  });

  it('clamps Jan 31 across multiple months without drifting', () => {
    expect(ymd(addMonths(new Date(2026, 0, 31), 2))).toBe('2026-03-31');
  });
});
