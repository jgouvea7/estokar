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

type AnalyticsTopStockChartProps = {
  data: { productId: string; productName: string; quantity: number }[];
};

export function AnalyticsTopStockChart({ data }: AnalyticsTopStockChartProps) {
  const chartData = useMemo(() => {
    const top5 = [...data].sort((a, b) => b.quantity - a.quantity).slice(0, 5);
    return top5.map((d) => ({
      name: d.productName.length > 14 ? d.productName.slice(0, 14) + '...' : d.productName,
      quantidade: d.quantity,
    }));
  }, [data]);

  if (!chartData.length) return null;

  return (
    <section className="surface-card p-4 sm:p-5">
      <div className="mb-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-(--muted)">Ranking</p>
        <h3 className="mt-1 text-base font-bold text-(--ink)">Top 5 Estoque</h3>
      </div>
      <div className="h-44 sm:h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--stroke)" />
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
            <Line
              type="monotone"
              dataKey="quantidade"
              stroke="var(--accent)"
              strokeWidth={2.5}
              dot={{ r: 4, fill: 'var(--accent)', stroke: 'var(--card)', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: 'var(--accent)', stroke: 'var(--card)', strokeWidth: 2 }}
              name="Estoque"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
