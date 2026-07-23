"use client";

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

type AnalyticsTimelineChartProps = {
  data: { date: string; balance: number }[];
};

export function AnalyticsTimelineChart({ data }: AnalyticsTimelineChartProps) {
  const chartData = useMemo(
    () =>
      data.map((p) => ({
        date: p.date,
        balance: p.balance,
        label: new Date(p.date + 'T00:00:00').toLocaleDateString('pt-BR', {
          day: 'numeric',
          month: 'short',
        }),
      })),
    [data],
  );

  if (!data.length) return null;

  const minBalance = Math.min(...chartData.map((d) => d.balance));
  const maxBalance = Math.max(...chartData.map((d) => d.balance));
  const padding = Math.max(1, Math.abs(maxBalance - minBalance) * 0.1);
  const yDomain = [minBalance - padding, maxBalance + padding];

  return (
    <section className="surface-card p-5 sm:p-6">
      <div className="mb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-(--muted)">Gráfico</p>
        <h3 className="mt-1 text-lg font-bold text-(--ink)">Movimentação do Estoque</h3>
      </div>
      <div className="h-56 sm:h-72 w-full">
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
}
