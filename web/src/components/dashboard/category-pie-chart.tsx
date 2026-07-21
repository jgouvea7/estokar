"use client";

import { memo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const COLORS = [
  'var(--accent)',
  'var(--ok)',
  'var(--low)',
  'var(--critical)',
  '#6366f1',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#8b5cf6',
  '#06b6d4',
];

type CategoryPieChartProps = {
  data: { categoryName: string; stock: number; percentage: number }[];
};

export const CategoryPieChart = memo(function CategoryPieChart({ data }: CategoryPieChartProps) {
  if (!data.length) return null;

  return (
    <section className="surface-card p-5 sm:p-6 h-full flex flex-col">
      <div className="mb-4 shrink-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-(--muted)">Distribuição</p>
        <h3 className="mt-1 text-lg font-bold text-(--ink)">Estoque por Categoria</h3>
      </div>

      <div className="flex flex-1 items-center min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="stock"
              nameKey="categoryName"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              strokeWidth={0}
            >
              {data.map((_, index) => (
                <Cell
                  key={index}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--card)',
                border: '2px solid var(--stroke)',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--ink)',
              }}
              formatter={(value, name) => [
                `${Number(value ?? 0).toLocaleString('pt-BR')} un.`,
                String(name ?? ''),
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 space-y-2">
        {data.map((item, index) => (
          <div key={item.categoryName} className="flex items-center justify-between gap-3 rounded-lg border-2 border-(--stroke) bg-(--surface-2) px-3 py-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className="h-3 w-3 shrink-0 rounded-sm"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="truncate text-sm font-bold text-(--ink)">{item.categoryName}</span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs font-medium text-(--muted)">{item.percentage.toFixed(1)}%</span>
              <span className="text-sm font-bold text-(--ink)">{item.stock.toLocaleString('pt-BR')}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
});
