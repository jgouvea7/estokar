"use client";

import { memo } from 'react';
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

type AnalyticsWeekdayChartProps = {
  data: { day: string; entries: number; outputs: number }[];
};

export const AnalyticsWeekdayChart = memo(function AnalyticsWeekdayChart({ data }: AnalyticsWeekdayChartProps) {
  if (!data.length) return null;

  return (
    <section className="surface-card p-5 sm:p-6">
      <div className="mb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-(--muted)">Distribuição</p>
        <h3 className="mt-1 text-lg font-bold text-(--ink)">Movimentações por Dia da Semana</h3>
      </div>
      <div className="h-56 sm:h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--stroke)" />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 10, fill: 'var(--muted)', fontWeight: 600 }}
              tickLine={false}
              axisLine={{ stroke: 'var(--stroke)' }}
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
            />
            <Bar dataKey="outputs" fill="var(--critical)" name="Saídas" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
});
