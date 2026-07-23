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

type AnalyticsCategoryPerformanceChartProps = {
  data: { categoryName: string; sales: number; stock: number; percentage: number }[];
};

export function AnalyticsCategoryPerformanceChart({
  data,
}: AnalyticsCategoryPerformanceChartProps) {
  const chartData = useMemo(
    () =>
      data.map((d) => ({
        ...d,
        name: d.categoryName.length > 12 ? d.categoryName.slice(0, 12) + '...' : d.categoryName,
      })),
    [data],
  );

  if (!data.length) return null;

  return (
    <section className="surface-card p-5 sm:p-6">
      <div className="mb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-(--muted)">Categorias</p>
        <h3 className="mt-1 text-lg font-bold text-(--ink)">Vendas vs Estoque por Categoria</h3>
      </div>
      <div className="h-56 sm:h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
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
              labelFormatter={(label) => String(label ?? '')}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted)' }}
            />
            <Bar dataKey="sales" fill="var(--accent)" name="Vendas" radius={[4, 4, 0, 0]} />
            <Bar dataKey="stock" fill="var(--muted)" name="Estoque" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
