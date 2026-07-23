"use client";

import Link from 'next/link';
import { TrendingDown } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

type AnalyticsLowestSellingChartProps = {
  data: { productId: string; productName: string; quantity: number }[];
};

export function AnalyticsLowestSellingChart({ data }: AnalyticsLowestSellingChartProps) {
  if (!data.length) return null;

  const maxQuantity = Math.max(...data.map((d) => d.quantity), 1);

  return (
    <section className="surface-card p-5 sm:p-6">
      <div className="mb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-(--muted)">Ranking</p>
        <h3 className="mt-1 text-lg font-bold text-(--ink)">Menos Vendidos</h3>
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
}
