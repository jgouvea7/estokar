"use client";

import Link from 'next/link';
import { BarChart3 } from 'lucide-react';
import { formatNumber, formatMetric, formatDays } from '@/lib/utils';

type AnalyticsForecastTableProps = {
  data: {
    productId: string;
    productName: string;
    currentStock: number;
    averageDailySales: number;
    estimatedDaysLeft: number | null;
    status: 'critical' | 'warning' | 'ok';
  }[];
};

export function AnalyticsForecastTable({ data }: AnalyticsForecastTableProps) {
  if (!data.length) {
    return (
      <section className="surface-card p-5 sm:p-6">
        <div className="mb-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-(--muted)">Previsão</p>
          <h3 className="mt-1 text-lg font-bold text-(--ink)">Estimativa de Dias Restantes</h3>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-(--stroke) bg-(--surface-2) px-6 py-8 text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-(--card) text-(--muted)">
            <BarChart3 size={18} strokeWidth={2.2} />
          </div>
          <p className="text-sm font-bold text-(--ink)">Nenhum produto cadastrado</p>
          <p className="mt-1 text-xs font-medium text-(--muted)">Cadastre produtos para ver a previsão de estoque.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="surface-card p-5 sm:p-6">
      <div className="mb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-(--muted)">Previsão</p>
        <h3 className="mt-1 text-lg font-bold text-(--ink)">Estimativa de Dias Restantes</h3>
        <p className="mt-1 text-sm text-(--muted)">
          {data.filter((p) => p.status === 'critical').length > 0
            ? `${data.filter((p) => p.status === 'critical').length} produtos precisam de reposição urgente.`
            : `${data.length} produtos monitorados.`}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b-2 border-(--stroke) text-[10px] font-bold uppercase tracking-widest text-(--muted)">
              <th className="pb-3 pr-4">Produto</th>
              <th className="pb-3 pr-4 text-right">Estoque</th>
              <th className="pb-3 pr-4 text-right">Média/dia</th>
              <th className="pb-3 pr-4 text-right">Dias restantes</th>
              <th className="pb-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-(--stroke)">
            {data.map((item) => {
              const statusConfig = item.status === 'critical'
                ? { label: 'Crítico', className: 'text-(--critical) bg-(--critical-soft) border-(--critical)' }
                : item.status === 'warning'
                  ? { label: 'Atenção', className: 'text-(--low) bg-(--low-soft) border-(--low)' }
                  : { label: 'OK', className: 'text-(--ok) bg-(--ok-soft) border-(--ok)' };

              return (
                <tr key={item.productId} className="group transition-colors hover:bg-(--surface-2)">
                  <td className="py-3 pr-4">
                    <Link
                      href={`/products/${item.productId}`}
                      className="text-sm font-bold text-(--ink) transition-colors hover:text-(--accent)"
                    >
                      {item.productName}
                    </Link>
                  </td>
                  <td className="py-3 pr-4 text-right text-sm font-bold text-(--ink)">
                    {formatNumber(item.currentStock)}
                  </td>
                  <td className="py-3 pr-4 text-right text-sm font-medium text-(--muted)">
                    {formatMetric(item.averageDailySales)}
                  </td>
                  <td className="py-3 pr-4 text-right text-sm font-bold text-(--ink)">
                    {item.estimatedDaysLeft === null ? '—' : formatDays(item.estimatedDaysLeft)}
                  </td>
                  <td className="py-3 text-right">
                    <span className={`inline-block rounded-md border-2 px-2 py-0.5 text-[10px] font-bold ${statusConfig.className}`}>
                      {statusConfig.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
