import type { AnalyticsFilter } from './types';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export function aggregateByPeriod<T extends { date: string }>(
  data: T[] | undefined,
  filter: AnalyticsFilter,
): T[] {
  if (!data || !data.length) return [];
  if (!filter || filter === 'daily') return data;

  const groups = new Map<string, T & { entries: number; outputs: number; balance: number; label: string }>();
  for (const item of data) {
    const rawDate = (item as { date: string }).date;
    if (!rawDate) continue;
    const dateStr = rawDate.length > 10 ? rawDate.slice(0, 10) : rawDate;
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) continue;
    const key = (() => {
      switch (filter) {
        case 'weekly': {
          const start = new Date(d);
          start.setDate(d.getDate() - d.getDay());
          return start.toISOString().slice(0, 10);
        }
        case 'monthly':
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
        case 'yearly':
          return `${d.getFullYear()}-01-01`;
        default:
          return rawDate;
      }
    })();
    const existing = groups.get(key);
    const entry = item as T & { entries: number; outputs: number; balance: number };
    if (existing) {
      existing.entries += entry.entries;
      existing.outputs += entry.outputs;
      existing.balance = existing.entries - existing.outputs;
    } else {
      let label: string;
      if (filter === 'weekly') {
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        const fmt = (dt: Date) => `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}`;
        label = `${fmt(weekStart)} - ${fmt(weekEnd)}`;
      } else if (filter === 'monthly') {
        label = MONTH_NAMES[d.getMonth()];
      } else {
        label = String(d.getFullYear());
      }
      groups.set(key, { ...entry, date: key, label });
    }
  }
  return Array.from(groups.values()) as unknown as T[];
}
