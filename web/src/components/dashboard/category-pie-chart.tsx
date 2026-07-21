"use client";

import { memo, useMemo, useState, useEffect } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#d97706', '#0D9488', '#4F46E5', '#059669'];
const OTHERS_COLOR = '#8b8c9a';

type CategoryPieChartProps = {
  data: { categoryName: string; stock: number; percentage: number }[];
};

export const CategoryPieChart = memo(function CategoryPieChart({ data }: CategoryPieChartProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  const aggregated = useMemo(() => {
    const top4 = data.slice(0, 4);
    const rest = data.slice(4);
    if (!rest.length) return top4;
    const othersStock = rest.reduce((s, i) => s + i.stock, 0);
    return [...top4, { categoryName: 'Outros', stock: othersStock, percentage: 0 }];
  }, [data]);

  const totalStock = useMemo(() => data.reduce((s, i) => s + i.stock, 0), [data]);

  const aggregatedWithPercent = useMemo(() => {
    return aggregated.map((item) => ({
      ...item,
      percentage: totalStock > 0 ? (item.stock / totalStock) * 100 : 0,
    }));
  }, [aggregated, totalStock]);

  if (!data.length) return null;

  return (
    <section className="surface-card flex min-h-[24rem] flex-col p-5 sm:min-h-[32rem] sm:p-6">
      <div className="mb-3 shrink-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-(--muted)">Distribuição</p>
        <h3 className="mt-1 text-lg font-bold text-(--ink)">Estoque por Categoria</h3>
      </div>

      <div className="flex flex-1 flex-col gap-4 sm:min-h-0 sm:flex-row">
        <div className="relative h-[260px] w-full self-center sm:h-[320px] lg:h-[360px] sm:flex-[3]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={aggregatedWithPercent}
                dataKey="stock"
                nameKey="categoryName"
                cx="50%"
                cy="50%"
                innerRadius={isMobile ? 52 : 88}
                outerRadius={isMobile ? 82 : 118}
                cornerRadius={12}
                paddingAngle={0}
                strokeWidth={3}
              >
                {aggregatedWithPercent.map((_, index) => (
                  <Cell
                    key={index}
                    fill={index < 4 ? COLORS[index] : OTHERS_COLOR}
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
                wrapperStyle={{ zIndex: 20 }}
                formatter={(value, name) => [
                  `${Number(value ?? 0).toLocaleString('pt-BR')} un.`,
                  String(name ?? ''),
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
            <div className="text-center leading-tight">
              <p className="text-2xl font-bold text-(--ink)">{totalStock.toLocaleString('pt-BR')}</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-(--muted)">Total</p>
            </div>
          </div>
        </div>

        <div className="space-y-2 pt-1 sm:flex-1 sm:pt-2">
          {aggregatedWithPercent.map((item, index) => (
            <div key={item.categoryName} className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: index < 4 ? COLORS[index] : OTHERS_COLOR }}
              />
              <span className="text-[11px] font-semibold text-(--muted) leading-tight truncate">
                {item.categoryName}
                <span className="ml-1 text-(--ink)">{item.percentage.toFixed(0)}%</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});
