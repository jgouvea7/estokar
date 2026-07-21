"use client";

import { memo, useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

type Period = 'weekly' | 'monthly' | 'yearly';

function filterByPeriod(points: { date: string; balance: number }[], period: Period) {
  const now = new Date();
  const cutoff = new Date(now);

  switch (period) {
    case 'weekly':
      cutoff.setDate(cutoff.getDate() - 7);
      break;
    case 'monthly':
      cutoff.setMonth(cutoff.getMonth() - 1);
      break;
    case 'yearly':
      cutoff.setFullYear(cutoff.getFullYear() - 1);
      break;
  }

  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return points.filter((p) => p.date >= cutoffStr);
}

const periodLabels: Record<Period, string> = {
  weekly: 'Semanal',
  monthly: 'Mensal',
  yearly: 'Anual',
};

function formatDate(dateStr: string, period: Period) {
  const d = new Date(dateStr + 'T00:00:00');
  if (period === 'weekly') {
    return d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' });
  }
  if (period === 'monthly') {
    return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
  }
  return d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
}

type StockTimelineChartProps = {
  data: { date: string; balance: number }[];
  title?: string;
};

export const StockTimelineChart = memo(function StockTimelineChart({ data, title }: StockTimelineChartProps) {
  const [period, setPeriod] = useState<Period>('monthly');

  const filtered = useMemo(() => filterByPeriod(data, period), [data, period]);

  const chartData = useMemo(
    () =>
      filtered.map((p) => ({
        date: p.date,
        balance: p.balance,
        label: formatDate(p.date, period),
      })),
    [filtered, period],
  );

  if (!data.length) return null;

  const minBalance = Math.min(...chartData.map((d) => d.balance));
  const maxBalance = Math.max(...chartData.map((d) => d.balance));
  const yDomain = [minBalance - Math.max(1, Math.abs(minBalance) * 0.1), maxBalance + Math.max(1, Math.abs(maxBalance) * 0.1)];

  return (
    <section className="surface-card p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-(--muted)">Gráfico</p>
          {title && <h3 className="mt-1 text-lg font-bold text-(--ink)">{title}</h3>}
        </div>
        <div className="flex gap-1 rounded-lg border-2 border-(--stroke) p-0.5">
          {(Object.keys(periodLabels) as Period[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`rounded-md px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all ${
                period === p
                  ? 'bg-(--button) text-white'
                  : 'text-(--muted) hover:text-(--ink)'
              }`}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--stroke)" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: 'var(--muted)', fontWeight: 600 }}
              tickLine={false}
              axisLine={{ stroke: 'var(--stroke)' }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--muted)', fontWeight: 600 }}
              tickLine={false}
              axisLine={false}
              domain={yDomain}
              width={48}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--card)',
                border: '2px solid var(--stroke)',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--ink)',
              }}
              labelFormatter={(label) => String(label ?? '')}
              formatter={(value) => [Number(value ?? 0).toLocaleString('pt-BR'), 'Saldo']}
            />
            <Line
              type="monotone"
              dataKey="balance"
              stroke="var(--accent)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, fill: 'var(--accent)', stroke: 'var(--card)', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
});
