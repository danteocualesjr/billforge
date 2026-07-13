export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function toIso(date: Date): string {
  return date.toISOString();
}

export function daysBetween(start: Date, end: Date): number {
  return Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

export function fractionRemaining(periodStart: Date, periodEnd: Date, at: Date): number {
  const total = periodEnd.getTime() - periodStart.getTime();
  if (total <= 0) return 0;
  const remaining = periodEnd.getTime() - at.getTime();
  return Math.max(0, Math.min(1, remaining / total));
}
