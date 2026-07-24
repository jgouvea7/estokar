import { calculateForecast, toNumber } from './forecast.util';

describe('calculateForecast', () => {
  it('returns null estimatedDaysLeft for negative stock', () => {
    const result = calculateForecast({
      currentStock: -5,
      soldLast7Days: 10,
    });
    expect(result.averageDailySales).toBe(0);
    expect(result.estimatedDaysLeft).toBeNull();
  });

  it('returns null estimatedDaysLeft for non-finite stock', () => {
    const result = calculateForecast({
      currentStock: NaN,
      soldLast7Days: 10,
    });
    expect(result.averageDailySales).toBe(0);
    expect(result.estimatedDaysLeft).toBeNull();
  });

  it('returns 0 estimatedDaysLeft when stock is 0 but has sales', () => {
    const result = calculateForecast({
      currentStock: 0,
      soldLast7Days: 7,
    });
    expect(result.averageDailySales).toBe(1);
    expect(result.estimatedDaysLeft).toBe(0);
  });

  it('uses 7-day window when soldLast7Days > 0', () => {
    const result = calculateForecast({
      currentStock: 21,
      soldLast7Days: 7,
      soldLast14Days: 14,
      soldLast30Days: 30,
    });
    expect(result.averageDailySales).toBe(1);
    expect(result.estimatedDaysLeft).toBe(21);
  });

  it('uses 14-day window when soldLast7Days = 0 and soldLast14Days > 0', () => {
    const result = calculateForecast({
      currentStock: 14,
      soldLast7Days: 0,
      soldLast14Days: 14,
      soldLast30Days: 30,
    });
    expect(result.averageDailySales).toBe(1);
    expect(result.estimatedDaysLeft).toBe(14);
  });

  it('uses 30-day window as fallback', () => {
    const result = calculateForecast({
      currentStock: 30,
      soldLast7Days: 0,
      soldLast14Days: 0,
      soldLast30Days: 30,
    });
    expect(result.averageDailySales).toBe(1);
    expect(result.estimatedDaysLeft).toBe(30);
  });

  it('returns null when no sales data is available', () => {
    const result = calculateForecast({
      currentStock: 10,
      soldLast7Days: 0,
      soldLast14Days: 0,
      soldLast30Days: 0,
    });
    expect(result.averageDailySales).toBe(0);
    expect(result.estimatedDaysLeft).toBeNull();
  });

  it('applies lead time safety stock', () => {
    const result = calculateForecast({
      currentStock: 30,
      soldLast7Days: 7,
      leadTimeDays: 5,
    });
    expect(result.averageDailySales).toBe(1);
    expect(result.estimatedDaysLeft).toBe(25);
  });
});

describe('toNumber', () => {
  it('converts numeric string correctly', () => {
    expect(toNumber('42')).toBe(42);
  });

  it('returns number as-is', () => {
    expect(toNumber(42)).toBe(42);
  });

  it('returns 0 for null', () => {
    expect(toNumber(null)).toBe(0);
  });

  it('returns 0 for undefined', () => {
    expect(toNumber(undefined)).toBe(0);
  });

  it('returns 0 for empty string', () => {
    expect(toNumber('')).toBe(0);
  });

  it('handles decimal strings', () => {
    expect(toNumber('3.14')).toBe(3.14);
  });
});
