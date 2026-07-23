"use client";

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

type AnalyticsDailyBalanceChartProps = {
  data: { date: string; entries: number; outputs: number; balance: number }[];
};

export function AnalyticsDailyBalanceChart({ data }: AnalyticsDailyBalanceChartProps) {
  const chartData = useMemo(
    () =>
      data.map((d) => ({
        ...d,
        label: new Date(d.date + 'T00:00:00').toLocaleDateString('pt-BR', {
          day: 'numeric',
          month: 'short',
        }),
      })),
    [data],
  );

  if (!data.length) return null;

  return (
    <section className="surface-card p-5 sm:p-6">
      <div className="mb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-(--muted)">Balanço</p>
        <h3 className="mt-1 text-lg font-bold text-(--ink)">Entradas vs Saídas por Dia</h3>
      </div>
      <div className="h-56 sm:h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
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
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted)' }}
            />
            <Bar dataKey="entries" fill="var(--ok)" name="Entradas" radius={[4, 4, 0, 0]} />
            <Bar dataKey="outputs" fill="var(--critical)" name="Saídas" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
