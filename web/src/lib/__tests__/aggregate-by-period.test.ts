import { aggregateByPeriod } from '@/lib/aggregate-by-period';

describe('aggregateByPeriod', () => {
  const baseData = [
    { date: '2026-07-20', entries: 5, outputs: 2, balance: 3 },
    { date: '2026-07-21', entries: 3, outputs: 1, balance: 2 },
    { date: '2026-07-22', entries: 10, outputs: 4, balance: 6 },
  ];

  it('returns empty array for undefined data', () => {
    expect(aggregateByPeriod(undefined, 'daily')).toEqual([]);
  });

  it('returns empty array for empty data', () => {
    expect(aggregateByPeriod([], 'daily')).toEqual([]);
  });

  it('returns data unchanged for daily filter', () => {
    expect(aggregateByPeriod(baseData, 'daily')).toEqual(baseData);
  });

  it('returns data unchanged for null filter', () => {
    expect(aggregateByPeriod(baseData, null as unknown as never)).toEqual(baseData);
  });

  describe('weekly', () => {
    it('groups items from the same week', () => {
      const data = [
        { date: '2026-07-20', entries: 5, outputs: 2, balance: 3 },
        { date: '2026-07-22', entries: 10, outputs: 4, balance: 6 },
      ];
      const result = aggregateByPeriod(data, 'weekly');
      expect(result).toHaveLength(1);
      expect(result[0].entries).toBe(15);
      expect(result[0].outputs).toBe(6);
      expect(result[0].balance).toBe(9);
    });

    it('label uses SUNDAY as start (not item date)', () => {
      // Wednesday 2026-07-22 -> week starts Sunday 2026-07-19
      const data = [
        { date: '2026-07-22', entries: 1, outputs: 0, balance: 1 },
      ];
      const result = aggregateByPeriod(data, 'weekly');
      expect(result[0].label).toBe('19/07 - 25/07');
    });

    it('label format is dd/MM - dd/MM', () => {
      // Monday 2026-07-20 -> week starts Sunday 2026-07-19
      const data = [
        { date: '2026-07-20', entries: 1, outputs: 0, balance: 1 },
      ];
      const result = aggregateByPeriod(data, 'weekly');
      expect(result[0].label).toMatch(/^\d{2}\/\d{2} - \d{2}\/\d{2}$/);
    });

    it('separates items from different weeks', () => {
      const data = [
        { date: '2026-07-13', entries: 1, outputs: 0, balance: 1 }, // Mon of week 7/12-7/18
        { date: '2026-07-20', entries: 1, outputs: 0, balance: 1 }, // Mon of week 7/19-7/25
      ];
      const result = aggregateByPeriod(data, 'weekly');
      expect(result).toHaveLength(2);
    });
  });

  describe('monthly', () => {
    it('groups items from the same month', () => {
      const data = [
        { date: '2026-07-01', entries: 5, outputs: 2, balance: 3 },
        { date: '2026-07-15', entries: 10, outputs: 4, balance: 6 },
      ];
      const result = aggregateByPeriod(data, 'monthly');
      expect(result).toHaveLength(1);
      expect(result[0].entries).toBe(15);
      expect(result[0].outputs).toBe(6);
    });

    it('label returns month name in Portuguese', () => {
      const data = [
        { date: '2026-07-15', entries: 1, outputs: 0, balance: 1 },
      ];
      const result = aggregateByPeriod(data, 'monthly');
      expect(result[0].label).toBe('Julho');
    });

    it('separates items from different months', () => {
      const data = [
        { date: '2026-06-15', entries: 1, outputs: 0, balance: 1 },
        { date: '2026-07-15', entries: 1, outputs: 0, balance: 1 },
      ];
      const result = aggregateByPeriod(data, 'monthly');
      expect(result).toHaveLength(2);
    });
  });

  describe('yearly', () => {
    it('groups items from the same year', () => {
      const data = [
        { date: '2026-01-15', entries: 5, outputs: 2, balance: 3 },
        { date: '2026-07-20', entries: 10, outputs: 4, balance: 6 },
      ];
      const result = aggregateByPeriod(data, 'yearly');
      expect(result).toHaveLength(1);
      expect(result[0].entries).toBe(15);
    });

    it('label returns the year', () => {
      const data = [
        { date: '2026-07-15', entries: 1, outputs: 0, balance: 1 },
      ];
      const result = aggregateByPeriod(data, 'yearly');
      expect(result[0].label).toBe('2026');
    });

    it('separates items from different years', () => {
      const data = [
        { date: '2025-06-15', entries: 1, outputs: 0, balance: 1 },
        { date: '2026-07-15', entries: 1, outputs: 0, balance: 1 },
      ];
      const result = aggregateByPeriod(data, 'yearly');
      expect(result).toHaveLength(2);
    });
  });
});
