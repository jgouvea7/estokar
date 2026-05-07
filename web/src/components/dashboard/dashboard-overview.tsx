"use client";

import Link from 'next/link';
import type { ComponentType } from 'react';
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  Boxes,
  Clock3,
  Flame,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import type { DashboardOverviewData } from '@/lib/dashboard/dashboard-data';
import type {
  DashboardLowStockProduct,
  DashboardRecentMovement,
  DashboardTopSellingProduct,
} from '@/lib/types';

type DashboardOverviewProps = {
  data: DashboardOverviewData;
};

export function DashboardOverview({ data }: DashboardOverviewProps) {
  const soldTotal = data.topSellingProducts.reduce((total, item) => total + item.soldQuantity, 0);
  const lowStockCount = data.lowStockProducts.length;
  const movementCount = data.recentMovements.length;
  const attentionCount = lowStockCount + data.topCategories.length;
  console.log(data.weeklySales)

  return (
    <div className="space-y-8 reveal-up">
      <section
        className="relative overflow-hidden rounded-4xl p-8 text-white shadow-[0_28px_80px_-35px_rgba(15,23,42,0.95)] lg:p-10"
        style={{ backgroundImage: 'var(--brand-gradient)' }}
      >
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-blue-500/15 blur-3xl" />
        <div className="absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-100">
              <BarChart3 size={12} />
              Painel principal
            </div>
            <h3 className="text-4xl font-bold tracking-tight lg:text-5xl">
              Dashboard operacional em tempo real.
            </h3>
            <p className="max-w-xl text-sm leading-6 text-slate-300 lg:text-base">
              Vendas, previsões de estoque e movimentações recentes em uma visão única para o time.
            </p>
          </div>

          <Link
            href="/products"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/10 px-5 text-sm font-bold text-white backdrop-blur-sm transition-all hover:bg-white/15"
          >
            <Boxes size={18} strokeWidth={2.3} />
            Ver produtos
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Boxes} label="Estoque total" value={formatNumber(data.totalStock)} tone="blue" />
        <MetricCard
          icon={BarChart3}
          label="Disponibilidade de catálogo"
          value={`${data.catalogAvailability.toFixed(0)}%`}
          tone="orange"
          helperText="SKUs com saldo positivo"
        />
        <MetricCard
          icon={data.weeklySales.direction === 'up' ? TrendingUp : TrendingDown}
          label="Vendas semanais"
          value={data.weeklySales.valueLabel}
          tone={data.weeklySales.direction === 'up' ? 'green' : data.weeklySales.direction === 'down' ? 'rose' : 'slate'}
          helperText={data.weeklySales.comparisonLabel}
        />
        <MetricCard
          icon={data.dailyBalance >= 0 ? TrendingUp : TrendingDown}
          label="Balanço diário"
          value={(data.dailyBalance > 0 ? '+' : '') + formatNumber(data.dailyBalance)}
          tone={data.dailyBalance > 0 ? 'green' : data.dailyBalance < 0 ? 'rose' : 'slate'}
          helperText="Saldo líquido de hoje"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <section className="surface-card flex h-full flex-col p-6 lg:p-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h4 className="text-xl font-bold text-[#0f172a]">Movimentações recentes</h4>
                <p className="text-sm font-medium text-slate-500">Últimos eventos de entrada e saída no inventário.</p>
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                Log de eventos
              </div>
            </div>

            <div className="flex-1">
              <RecentMovementsTimeline items={data.recentMovements} />
            </div>
          </section>
        </div>

        {/* Coluna da Direita: Rankings e Alertas */}
        <div className="space-y-6 lg:col-span-1">
          <section className="surface-card p-6 lg:p-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h4 className="text-xl font-bold text-[#0f172a]">Produtos mais vendidos</h4>
                <p className="text-sm font-medium text-slate-500">Ranking por volume total.</p>
              </div>
              <Flame size={18} className="text-blue-500" />
            </div>

            <TopSellingChart items={data.topSellingProducts} />
          </section>

          {data.topCategories.length ? (
            <section className="surface-card p-6 lg:p-8">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-xl font-bold text-[#0f172a]">Categorias populares</h4>
                  <p className="text-sm font-medium text-slate-500">Top categorias por saída.</p>
                </div>
                <BarChart3 size={18} className="text-blue-500" />
              </div>

              <TopCategoryList items={data.topCategories} />
            </section>
          ) : null}

          <section className="surface-card p-6 lg:p-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h4 className="text-xl font-bold text-[#0f172a]">Estoque baixo</h4>
                <p className="text-sm font-medium text-slate-500">Alertas de reposição.</p>
              </div>
              <AlertCircle size={18} className="text-orange-500" />
            </div>

            <ProductAlertList items={data.lowStockProducts} />
          </section>
        </div>
      </section>
    </div>
  );
}

function TopSellingChart({ items }: { items: DashboardTopSellingProduct[] }) {
  if (!items.length) {
    return <EmptyState icon={BarChart3} title="Sem vendas registradas" description="Assim que houver saídas, o ranking aparecerá aqui." />;
  }

  const maxSold = Math.max(...items.map((item) => item.soldQuantity), 1);

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const width = `${Math.max((item.soldQuantity / maxSold) * 100, 6)}%`;

        return (
          <Link key={item.productId} href={`/products/${item.productId}`} className="block transition-transform hover:scale-[1.01] active:scale-95">
            <article className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition-all hover:border-blue-200 hover:bg-white">
              <div className="mb-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#0f172a]">{item.productName}</p>
                    <p className="text-xs font-medium text-slate-500">Estoque atual: {item.currentQuantity} un.</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[#0f172a]">{formatNumber(item.soldQuantity)}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400"></p>
                </div>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#1d4ed8_0%,#38bdf8_100%)] shadow-[0_6px_18px_-8px_rgba(59,130,246,0.8)] transition-all duration-700"
                  style={{ width }}
                />
              </div>
            </article>
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
    <div className="space-y-3">
      {items.map((item) => (
        <Link key={item.productId} href={`/products/${item.productId}`} className="block transition-transform hover:scale-[1.01] active:scale-95">
          <article
            className="group flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition-all hover:border-orange-200 hover:bg-white"
          >
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.status === 'critical' ? 'bg-rose-100 text-rose-600' : 'bg-orange-100 text-orange-600'}`}>
              <AlertCircle size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-[#0f172a]">{item.productName}</p>
              <p className="text-xs font-medium text-slate-500">
                Atual: <span className="text-slate-900">{item.currentQuantity}</span>
              </p>
            </div>
            <div className="text-right">
              <p className={`text-xs font-bold uppercase tracking-widest ${item.status === 'critical' ? 'text-rose-600' : 'text-orange-600'}`}>
                {item.status === 'critical' ? 'Crítico' : 'Baixo'}
              </p>
              <p className="text-[11px] font-medium text-slate-400">{item.threshold}</p>
            </div>
          </article>
        </Link>
      ))}
    </div>
  );
}

function TopCategoryList({
  items,
}: {
  items: DashboardOverviewData['topCategories'];
}) {
  if (!items.length) {
    return <EmptyState icon={BarChart3} title="Sem categorias vendidas" description="Ainda não há saídas suficientes para montar o ranking por categoria." />;
  }

  const maxSold = Math.max(...items.map((item) => item.soldQuantity), 1);

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const width = `${Math.max((item.soldQuantity / maxSold) * 100, 8)}%`;

        return (
          <Link key={item.categoryName} href={`/products?category=${encodeURIComponent(item.categoryName)}`} className="block transition-transform hover:scale-[1.01] active:scale-95">
            <article className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition-all hover:border-blue-200 hover:bg-white">
              <div className="mb-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600">
                    {item.rank}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#0f172a]">{item.categoryName}</p>
                    <p className="text-xs font-medium text-slate-500">{item.percentage.toFixed(0)}% do total vendido</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[#0f172a]">{formatNumber(item.soldQuantity)}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400"></p>
                </div>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#1d4ed8_0%,#38bdf8_100%)] shadow-[0_6px_18px_-8px_rgba(59,130,246,0.8)] transition-all duration-700"
                  style={{ width }}
                />
              </div>
            </article>
          </Link>
        );
      })}
    </div>
  );
}

function RecentMovementsTimeline({ items }: { items: DashboardRecentMovement[] }) {
  if (!items.length) {
    return <EmptyState icon={Clock3} title="Sem movimentações" description="As últimas entradas e saídas aparecerão aqui." />;
  }

  return (
    <div className="relative space-y-4 pl-4">
      <div className="absolute left-3.5 top-2 h-[calc(100%-8px)] w-px bg-slate-200" />
      {items.map((movement) => (
        <article key={movement.id} className="relative pl-8">
          <div className={`absolute left-0 top-4 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full ${movement.type === 'in' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
            {movement.type === 'in' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
          </div>

          <div className="surface-card flex items-center justify-between gap-4 rounded-2xl px-4 py-4 transition-colors hover:bg-slate-50">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[#0f172a]">{movement.productName}</p>
              <p className="mt-1 text-xs font-medium text-slate-500">
                {formatDateTime(movement.createdAt)} • {movement.type === 'in' ? 'Entrada' : 'Saída'}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <p className={`text-lg font-bold ${movement.type === 'in' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {movement.type === 'in' ? '+' : '-'}{movement.quantity}
              </p>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Unidades</span>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  tone,
  helperText,
}: {
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
  label: string;
  value: string;
  tone: 'blue' | 'orange' | 'rose' | 'slate' | 'green';
  helperText?: string;
}) {
  const toneMap = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    green: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    slate: 'bg-slate-50 text-slate-600 border-slate-100',
  };

  return (
    <article className="surface-card flex items-center gap-4 p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_45px_-30px_rgba(15,23,42,0.35)]">
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${toneMap[tone]}`}>
        <Icon size={22} strokeWidth={2.3} />
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight text-[#0f172a]">{value}</p>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
        {helperText ? <p className="mt-1 text-[11px] font-medium text-slate-400">{helperText}</p> : null}
      </div>
    </article>
  );
}

function MiniPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300">{label}</p>
      <p className="mt-1 text-lg font-bold text-white">{value}</p>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-10 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <Icon size={22} strokeWidth={2.2} />
      </div>
      <p className="text-sm font-bold text-[#0f172a]">{title}</p>
      <p className="mt-1 text-xs font-medium text-slate-500">{description}</p>
    </div>
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value);
}

function formatDays(value: number) {
  if (!Number.isFinite(value)) {
    return 'Sem previsão';
  }

  if (value < 1) {
    return '< 1 dia';
  }

  return `${value.toFixed(1)} dia(s)`;
}

function formatDateTime(value: string | Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
  }).format(new Date(value));
}