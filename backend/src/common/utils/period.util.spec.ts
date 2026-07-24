import { resolvePeriod, getStartDate, Period } from './period.util';

describe('resolvePeriod', () => {
  it('returns monthly for undefined input', () => {
    expect(resolvePeriod(undefined)).toBe('monthly');
  });

  it('returns monthly for empty string', () => {
    expect(resolvePeriod('')).toBe('monthly');
  });

  it('returns monthly for invalid input', () => {
    expect(resolvePeriod('invalid')).toBe('monthly');
  });

  it('accepts all valid period values', () => {
    expect(resolvePeriod('daily')).toBe('daily');
    expect(resolvePeriod('weekly')).toBe('weekly');
    expect(resolvePeriod('monthly')).toBe('monthly');
    expect(resolvePeriod('yearly')).toBe('yearly');
  });
});

describe('getStartDate', () => {
  const now = new Date('2026-07-23T12:00:00');

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('daily returns 1 day ago', () => {
    const result = getStartDate('daily');
    const expected = new Date('2026-07-22T00:00:00');
    expect(result.getTime()).toBe(expected.getTime());
  });

  it('weekly returns 7 days ago', () => {
    const result = getStartDate('weekly');
    const expected = new Date('2026-07-16T00:00:00');
    expect(result.getTime()).toBe(expected.getTime());
  });

  it('monthly returns ~1 month ago', () => {
    const result = getStartDate('monthly');
    const expected = new Date('2026-06-23T00:00:00');
    expect(result.getTime()).toBe(expected.getTime());
  });

  it('yearly returns ~1 year ago', () => {
    const result = getStartDate('yearly');
    const expected = new Date('2025-07-23T00:00:00');
    expect(result.getTime()).toBe(expected.getTime());
  });

  it('all periods return dates with hours set to 00:00:00', () => {
    const periods: Period[] = ['daily', 'weekly', 'monthly', 'yearly'];
    for (const period of periods) {
      const result = getStartDate(period);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    }
  });
});
