import { cn, formatNumber, formatMetric, formatDays, formatDate, formatDateTime } from '@/lib/utils';

describe('cn', () => {
  it('should join class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('should filter out falsy values', () => {
    expect(cn('foo', false, null, undefined, '', 'bar')).toBe('foo bar');
  });

  it('should return empty string for no classes', () => {
    expect(cn()).toBe('');
  });
});

describe('formatNumber', () => {
  it('should format number with pt-BR locale', () => {
    const result = formatNumber(1234.56);
    expect(result).toBe('1.234,56');
  });

  it('should format zero', () => {
    expect(formatNumber(0)).toBe('0');
  });
});

describe('formatMetric', () => {
  it('should format with one decimal place', () => {
    expect(formatMetric(123.456)).toBe('123,5');
  });

  it('should format whole numbers', () => {
    expect(formatMetric(10)).toBe('10');
  });
});

describe('formatDays', () => {
  it('should format with one decimal place', () => {
    expect(formatDays(15.67)).toBe('15,7');
  });

  it('should return 0 for negative values', () => {
    expect(formatDays(-5)).toBe('0');
    expect(formatDays(-0.1)).toBe('0');
  });

  it('should format zero', () => {
    expect(formatDays(0)).toBe('0');
  });
});

describe('formatDate', () => {
  it('should format date string with pt-BR locale', () => {
    const result = formatDate('2026-06-19T10:30:00');
    expect(result).toContain('19/06/2026');
  });

  it('should format Date object', () => {
    const result = formatDate(new Date('2026-06-19T10:30:00'));
    expect(result).toContain('19/06/2026');
  });

  it('should include hour and minute', () => {
    const result = formatDate('2026-06-19T10:30:00');
    expect(result).toContain('10:30');
  });
});

describe('formatDateTime', () => {
  it('should format with short date and time', () => {
    const result = formatDateTime('2026-06-19T10:30:00');
    expect(result).toContain('19/06');
    expect(result).toContain('10:30');
  });
});
