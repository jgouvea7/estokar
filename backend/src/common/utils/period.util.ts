export type Period = 'daily' | 'weekly' | 'monthly' | 'yearly';

const VALID_PERIODS: Period[] = ['daily', 'weekly', 'monthly', 'yearly'];

export function resolvePeriod(period?: string): Period {
  return VALID_PERIODS.includes(period as Period)
    ? (period as Period)
    : 'monthly';
}

export function getStartDate(period: Period): Date {
  const now = new Date();
  const d = new Date(now);
  switch (period) {
    case 'daily':
      d.setDate(d.getDate() - 1);
      break;
    case 'weekly':
      d.setDate(d.getDate() - 7);
      break;
    case 'monthly':
      d.setMonth(d.getMonth() - 1);
      break;
    case 'yearly':
      d.setFullYear(d.getFullYear() - 1);
      break;
  }
  d.setHours(0, 0, 0, 0);
  return d;
}
