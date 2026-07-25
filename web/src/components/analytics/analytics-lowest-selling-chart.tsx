"use client";

import { memo } from 'react';
import Link from 'next/link';
import { TrendingDown, BarChart3 } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import type { AnalyticsFilter } from '@/lib/types';

type AnalyticsLowestSellingChartProps = {
  data: { productId: string; productName: string; quantity: number }[];
  filter: AnalyticsFilter;
};

const subtitleByFilter: Record<string, string> = {
  daily: 'Menos vendidos hoje',
  weekly: 'Menos vendidos esta semana',
  monthly: 'Menos vendidos este mês',
  yearly: 'Menos vendidos este ano',
};

export const AnalyticsLowestSellingChart = memo(function AnalyticsLowestSellingChart({ data, filter }: AnalyticsLowestSellingChartProps) {
  const subtitle = filter ? subtitleByFilter[filter] : 'Menos Vendidos';

  if (!data || !data.length) {
    return (
      <section className="surface-card p-5 sm:p-6">
        <div className="mb-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-(--muted)">Ranking</p>
          <h3 className="mt-1 text-lg font-bold text-(--ink)">{subtitle}</h3>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-(--stroke) bg-(--surface-2) px-6 py-8 text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-(--card) text-(--muted)">
            <BarChart3 size={18} strokeWidth={2.2} />
          </div>
          <p className="text-sm font-bold text-(--ink)">Sem vendas no período</p>
          <p className="mt-1 text-xs font-medium text-(--muted)">Registre saídas para ver o ranking.</p>
        </div>
      </section>
    );
  }

  const maxQuantity = Math.max(...data.map((d) => d.quantity), 1);

  return (
    <section className="surface-card p-5 sm:p-6">
      <div className="mb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-(--muted)">Ranking</p>
        <h3 className="mt-1 text-lg font-bold text-(--ink)">{subtitle}</h3>
      </div>
      <div className="space-y-2">
        {data.map((item) => {
          const width = `${Math.max((item.quantity / maxQuantity) * 100, 4)}%`;
          return (
            <Link
              key={item.productId}
              href={`/products/${item.productId}`}
              className="group flex items-center gap-3 rounded-lg border-2 border-(--stroke) bg-(--surface-2) px-3 py-2.5 transition-all hover:bg-(--card)"
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-(--critical-soft) text-(--critical)">
                <TrendingDown size={12} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-bold text-(--ink)">{item.productName}</p>
                  <p className="shrink-0 text-sm font-bold text-(--muted)">{formatNumber(item.quantity)}</p>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-(--stroke)">
                  <div className="h-full rounded-full bg-(--low) transition-all duration-700" style={{ width }} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
});
