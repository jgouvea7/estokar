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
} from 'recharts';

type AnalyticsStockDistributionChartProps = {
  data: { productId: string; productName: string; quantity: number }[];
};

const TOP_N = 15;

export function AnalyticsStockDistributionChart({ data }: AnalyticsStockDistributionChartProps) {
  const chartData = useMemo(() => {
    const sorted = [...(data ?? [])].sort((a, b) => b.quantity - a.quantity).slice(0, TOP_N);
    return sorted.map((d) => ({
      ...d,
      name: d.productName.length > 14 ? d.productName.slice(0, 14) + '...' : d.productName,
    }));
  }, [data]);

  if (!chartData.length) return null;

  return (
    <section className="surface-card p-5 sm:p-6">
      <div className="mb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-(--muted)">Distribuição</p>
        <h3 className="mt-1 text-lg font-bold text-(--ink)">Estoque por Produto</h3>
      </div>
      <div className="h-72 sm:h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 40, left: -16 }} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--stroke)" />
            <XAxis
              type="number"
              tick={{ fontSize: 10, fill: 'var(--muted)', fontWeight: 600 }}
              tickLine={false}
              axisLine={{ stroke: 'var(--stroke)' }}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 10, fill: 'var(--muted)', fontWeight: 600 }}
              tickLine={false}
              axisLine={false}
              width={90}
              interval={0}
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
            <Bar dataKey="quantity" fill="var(--accent)" name="Estoque" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
