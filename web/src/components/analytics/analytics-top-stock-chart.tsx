"use client";

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#d97706', '#0D9488', '#4F46E5', '#059669', '#8b8c9a'];

type AnalyticsTopStockChartProps = {
  data: { productId: string; productName: string; quantity: number }[];
};

export function AnalyticsTopStockChart({ data }: AnalyticsTopStockChartProps) {
  const chartData = useMemo(() => {
    if (!data || !data.length) return [];
    const top5 = [...data].sort((a, b) => b.quantity - a.quantity).slice(0, 5);
    return top5.map((d, i) => ({
      name: d.productName.length > 14 ? d.productName.slice(0, 14) + '...' : d.productName,
      quantidade: d.quantity,
      color: COLORS[i % COLORS.length],
    }));
  }, [data]);

  if (!chartData.length) return null;

  return (
    <section className="surface-card p-4 sm:p-5">
      <div className="mb-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-(--muted)">Ranking</p>
        <h3 className="mt-1 text-base font-bold text-(--ink)">Top 5 Estoque</h3>
      </div>
      <div className="h-48 sm:h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--stroke)" vertical={false} />
            <XAxis
              dataKey="name"
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
              formatter={(value) => [Number(value ?? 0).toLocaleString('pt-BR'), 'Quantidade']}
              labelFormatter={(label) => String(label ?? '')}
            />
            <Bar dataKey="quantidade" name="Estoque" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
