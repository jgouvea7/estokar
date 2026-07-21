"use client";

import Link from 'next/link';
import { memo, type ComponentType } from 'react';
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  Boxes,
  Clock3,
  Download,
  TrendingDown,
  TrendingUp,
  Package2,
} from 'lucide-react';
import { StockTimelineChart } from '@/components/dashboard/stock-timeline-chart';
import { CategoryPieChart } from '@/components/dashboard/category-pie-chart';
import type { DashboardOverviewData } from '@/lib/dashboard/dashboard-data';
import type {
  DashboardLowStockProduct,
  DashboardRecentMovement,
  DashboardTopSellingProduct,
  DashboardForecastProduct,
  DashboardAlertProduct,
} from '@/lib/types';
import { exportDashboardCsv } from '@/lib/api/export';
import { formatNumber, formatMetric, formatDays, formatDateTime } from '@/lib/utils';

type DashboardOverviewProps = {
  data: DashboardOverviewData;
  accessToken: string;
  lastUpdatedAt: number;
};

export function DashboardOverview({ data, accessToken, lastUpdatedAt }: DashboardOverviewProps) {
  const hasData = data.totalStock > 0;

  const metrics = [
    { icon: Boxes, label: 'Estoque total', value: formatNumber(data.totalStock), tone: 'accent' as const },
    { icon: data.dailyBalance >= 0 ? TrendingUp : TrendingDown, label: 'Balanço diário', value: (data.dailyBalance > 0 ? '+' : '') + formatNumber(data.dailyBalance), tone: data.dailyBalance > 0 ? 'ok' as const : data.dailyBalance < 0 ? 'critical' as const : 'muted' as const },
    { icon: data.weeklySales.direction === 'up' ? TrendingUp : TrendingDown, label: 'Vendas na semana', value: data.weeklySales.valueLabel, tone: data.weeklySales.direction === 'up' ? 'ok' as const : data.weeklySales.direction === 'down' ? 'critical' as const : 'muted' as const },
    { icon: BarChart3, label: 'Catálogo ativo', value: `${data.catalogAvailability.toFixed(0)}%`, tone: 'accent' as const },
  ];

  return (
    <div className="space-y-6 reveal-up">
      <section className="flex items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <p className="text-sm font-medium text-(--muted)">Acompanhe seu estoque em tempo real.</p>
          <span className="hidden sm:flex items-center gap-1.5 text-[11px] font-medium text-(--muted) opacity-60">
            <Clock3 size={12} strokeWidth={2} />
            Última atualização {formatDateTime(new Date(lastUpdatedAt))}
          </span>
        </div>
        <button
          type="button"
          onClick={() => exportDashboardCsv(accessToken)}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border-2 border-(--stroke) bg-(--card) px-4 text-xs font-bold text-(--ink) transition-all hover:bg-(--soft)"
        >
          <Download size={14} strokeWidth={2.5} />
          CSV
        </button>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {metrics.map((metric) => (
          <CompactStat key={metric.label} {...metric} />
        ))}
      </section>

      {!hasData ? (
        <section className="surface-card p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-(--accent-soft) text-(--accent)">
            <Package2 size={28} strokeWidth={2} />
          </div>
          <h3 className="text-xl font-bold text-(--ink)">Seu estoque está vazio</h3>
          <p className="mt-2 text-sm text-(--muted) max-w-md mx-auto">
            Cadastre seu primeiro produto para começar a usar alertas, previsão de reposição e muito mais.
          </p>
          <Link
            href="/products"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-(--button) px-5 py-3 text-sm font-bold text-white transition-all hover:brightness-125"
          >
            <Package2 size={16} />
            Cadastrar primeiro produto
          </Link>
        </section>
      ) : (
        <>
          {data.lowStockProducts.length > 0 && (
            <section className="surface-card border-2 border-(--low-soft) p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-(--low)">Atenção</p>
                  <h3 className="mt-1 text-lg font-bold text-(--ink)">Estoque perto do fim</h3>
                </div>
                <AlertCircle size={18} className="text-(--low)" />
              </div>
              <p className="mb-4 text-sm text-(--muted)">
                Esses produtos precisam de reposição em breve. Quanto antes comprar, menos vendas você perde.
              </p>
              <ProductAlertList items={data.lowStockProducts} />
              <div className="mt-4">
                <Link
                  href="/products"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-(--button) px-4 py-2 text-xs font-bold text-white transition-all hover:brightness-125"
                >
                  Ver todos os produtos
                </Link>
              </div>
            </section>
          )}

          <StockTimelineChart data={data.timelinePoints} title="Movimentação do Estoque" />

          <section className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <div className="space-y-5">
              <ForecastSection
                forecastedProducts={data.forecastedProducts}
                alerts={data.alerts}
                lowStockProducts={data.lowStockProducts}
              />

              <div className="surface-card p-5 sm:p-6">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-(--muted)">Tempo real</p>
                    <h3 className="mt-1 text-lg font-bold text-(--ink)">Movimentações recentes</h3>
                  </div>
                  <Link
                    href="/history"
                    className="rounded-lg border-2 border-(--stroke) px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-(--muted) transition-all hover:bg-(--soft)"
                  >
                    Ver tudo
                  </Link>
                </div>
                <RecentMovementsTimeline items={data.recentMovements} />
              </div>
            </div>

            <div className="flex flex-col gap-5">
              <div className="min-h-0">
                <CategoryPieChart data={data.categoryStockPoints} />
              </div>
              <section className="surface-card p-5 sm:p-6 sm:flex-[1]">
                <div className="mb-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-(--muted)">Ranking</p>
                  <h3 className="mt-1 text-lg font-bold text-(--ink)">Mais vendidos</h3>
                </div>
                <TopSellingChart items={data.topSellingProducts.slice(0, 3)} />
              </section>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

const CompactStat = memo(function CompactStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
  label: string;
  value: string;
  tone: 'accent' | 'ok' | 'critical' | 'muted';
}) {
  const toneColors = {
    accent: 'text-(--accent) bg-(--accent-soft)',
    ok: 'text-(--ok) bg-(--ok-soft)',
    critical: 'text-(--critical) bg-(--critical-soft)',
    muted: 'text-(--muted) bg-(--soft)',
  };

  return (
    <article className="surface-card flex items-center gap-3 p-4">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${toneColors[tone]}`}>
        <Icon size={18} strokeWidth={2.3} />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-bold leading-none text-(--ink)">{value}</p>
        <p className="mt-1 truncate text-[10px] font-bold uppercase tracking-widest text-(--muted)">{label}</p>
      </div>
    </article>
  );
});

function TopSellingChart({ items }: { items: DashboardTopSellingProduct[] }) {
  if (!items.length) {
    return <EmptyState icon={BarChart3} title="Sem movimentações ainda" description="Registre saídas de produtos para ver o ranking dos mais vendidos." actionLabel="Cadastrar produto" actionHref="/products" />;
  }

  const maxSold = Math.max(...items.map((item) => item.soldQuantity), 1);

  return (
    <div className="space-y-2">
      {items.map((item, index) => {
        const width = `${Math.max((item.soldQuantity / maxSold) * 100, 4)}%`;

        return (
          <Link
            key={item.productId}
            href={`/products/${item.productId}`}
            className="group flex items-center gap-3 rounded-lg border-2 border-(--stroke) bg-(--surface-2) px-3 py-2.5 transition-all hover:bg-(--card)"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-(--soft) text-[10px] font-bold text-(--muted)">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-bold text-(--ink)">{item.productName}</p>
                <p className="shrink-0 text-sm font-bold text-(--ink)">{formatNumber(item.soldQuantity)}</p>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-(--stroke)">
                <div className="h-full rounded-full bg-(--accent) transition-all duration-700" style={{ width }} />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function ProductAlertList({ items }: { items: DashboardLowStockProduct[] }) {
  if (!items.length) {
    return <EmptyState icon={AlertCircle} title="Tudo sob controle" description="Nenhum produto está abaixo do limite configurado." />;
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <Link
          key={item.productId}
          href={`/products/${item.productId}`}
          className="group flex items-center gap-3 rounded-lg border-2 border-(--stroke) bg-(--surface-2) px-3 py-2.5 transition-all hover:bg-(--card)"
        >
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${item.status === 'critical' ? 'bg-(--critical-soft) text-(--critical)' : 'bg-(--low-soft) text-(--low)'}`}>
            <AlertCircle size={14} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-(--ink)">{item.productName}</p>
            <p className="text-xs font-medium text-(--muted)">
              {item.currentQuantity} un. — {item.status === 'critical' ? 'Crítico' : 'Baixo'}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}

function RecentMovementsTimeline({ items }: { items: DashboardRecentMovement[] }) {
  if (!items.length) {
    return <EmptyState icon={Clock3} title="Nenhuma movimentação" description="Registre entradas e saídas para ver o histórico aqui." actionLabel="Ir para Produtos" actionHref="/products" />;
  }

  return (
    <div className="space-y-2">
      {items.map((movement) => (
        <article
          key={movement.id}
          className="flex items-center gap-4 rounded-lg border-2 border-(--stroke) bg-(--surface-2) px-4 py-3 transition-all hover:bg-(--card)"
        >
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${movement.type === 'in' ? 'bg-(--ok-soft) text-(--ok)' : 'bg-(--critical-soft) text-(--critical)'}`}>
            {movement.type === 'in' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-(--ink)">{movement.productName}</p>
            <p className="text-xs font-medium text-(--muted)">
              {movement.type === 'in' ? 'Entrada' : 'Saída'} · {formatDateTime(movement.createdAt)}
            </p>
          </div>
          <p className={`shrink-0 text-lg font-bold ${movement.type === 'in' ? 'text-(--ok)' : 'text-(--critical)'}`}>
            {movement.type === 'in' ? '+' : '-'}{movement.quantity}
          </p>
        </article>
      ))}
    </div>
  );
}

function ForecastSection({
  forecastedProducts,
  alerts,
  lowStockProducts,
}: {
  forecastedProducts: DashboardForecastProduct[];
  alerts: DashboardAlertProduct[];
  lowStockProducts: DashboardLowStockProduct[];
}) {
  const criticalIds = new Set(lowStockProducts.map((p) => p.productId));

  const combined = forecastedProducts.map((fp) => {
    const alert = alerts.find((a) => a.productId === fp.productId);
    return {
      ...fp,
      alertDaysBefore: alert?.alertDaysBefore ?? null,
    };
  });

  const sorted = [...combined].sort((a, b) => {
    const aCritical = criticalIds.has(a.productId) ? 0 : 1;
    const bCritical = criticalIds.has(b.productId) ? 0 : 1;
    if (aCritical !== bCritical) return aCritical - bCritical;
    return (a.estimatedDaysLeft ?? Infinity) - (b.estimatedDaysLeft ?? Infinity);
  });

  if (!sorted.length) return null;

  const hasUrgentProducts = sorted.some(
    (p) =>
      criticalIds.has(p.productId) ||
      (p.estimatedDaysLeft !== null && p.estimatedDaysLeft <= (p.alertDaysBefore ?? 7)),
  );

  if (!hasUrgentProducts) {
    return (
      <section className="surface-card p-5 sm:p-6">
        <div className="mb-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-(--muted)">Previsão</p>
          <h3 className="mt-1 text-lg font-bold text-(--ink)">Estimativa de dias restantes</h3>
        </div>
        <EmptyState
          icon={BarChart3}
          title="Nenhum produto próximo do fim"
          description="Todos os produtos estão com estoque adequado dentro do período configurado."
        />
      </section>
    );
  }

  return (
    <section className="surface-card p-5 sm:p-6">
      <div className="mb-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-(--muted)">Previsão</p>
        <h3 className="mt-1 text-lg font-bold text-(--ink)">Estimativa de dias restantes</h3>
      </div>

      {sorted.length >= 5 && (
        <p className="mb-4 text-sm text-(--muted)">
          {sorted.filter((p) => criticalIds.has(p.productId)).length > 0
            ? `${sorted.filter((p) => criticalIds.has(p.productId)).length} produtos precisam de reposição urgente.`
            : `${sorted.length} produtos monitorados. Nenhum em estado crítico.`}
        </p>
      )}

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
            {sorted.slice(0, 8).map((item) => {
              const isCritical = criticalIds.has(item.productId);
              const status = isCritical
                ? { label: 'Crítico', className: 'text-(--critical) bg-(--critical-soft) border-(--critical)' }
                : item.estimatedDaysLeft !== null && item.estimatedDaysLeft <= (item.alertDaysBefore ?? 7)
                  ? { label: 'Atenção', className: 'text-(--low) bg-(--low-soft) border-(--low)' }
                  : { label: 'OK', className: 'text-(--ok) bg-(--ok-soft) border-(--ok)' };

              return (
                <tr key={item.productId} className="group transition-colors hover:bg-(--surface-2)">
                  <td className="py-3 pr-4">
                    <Link href={`/products/${item.productId}`} className="text-sm font-bold text-(--ink) transition-colors hover:text-(--accent)">
                      {item.productName}
                    </Link>
                    {isCritical && (
                      <span className="ml-2 inline-block text-[10px] font-bold text-(--critical)">⚠ Perde vendas</span>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-right text-sm font-bold text-(--ink)">{formatNumber(item.currentQuantity)}</td>
                  <td className="py-3 pr-4 text-right text-sm font-medium text-(--muted)">{formatMetric(item.averageDailySales)}</td>
                  <td className="py-3 pr-4 text-right text-sm font-bold text-(--ink)">
                    {item.estimatedDaysLeft === null ? '—' : formatDays(item.estimatedDaysLeft)}
                  </td>
                  <td className="py-3 text-right">
                    <span className={`inline-block rounded-md border-2 px-2 py-0.5 text-[10px] font-bold ${status.className}`}>
                      {status.label}
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

function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
}: {
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-(--stroke) bg-(--surface-2) px-6 py-8 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-(--card) text-(--muted)">
        <Icon size={18} strokeWidth={2.2} />
      </div>
      <p className="text-sm font-bold text-(--ink)">{title}</p>
      <p className="mt-1 text-xs font-medium text-(--muted)">{description}</p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-(--button) px-4 py-2 text-xs font-bold text-white transition-all hover:brightness-125"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
