"use client";

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type ComponentType } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  CalendarClock,
  Clock3,
  Image as ImageIcon,
  Package2,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { getProductDetails } from '@/lib/api/products';
import type { ProductDashboardMovement } from '@/lib/types';
import { useAuthStore } from '@/store/auth-store';

const NO_PHOTO_IMAGE = 'sem-foto';

type DashboardLoadState = {
  productName: string;
  productImage: string;
  productDescription: string;
  productCategory: string;
  currentStock: number;
  alertDaysBefore: number;
  totalEntries: number;
  totalOutputs: number;
  averageDailySales: number;
  estimatedDaysLeft: number | null;
  recentMovements: ProductDashboardMovement[];
};

type StockPoint = {
  date: string;
  stock: number;
};

export default function ProductDetailsPage() {
  const isDev = process.env.NODE_ENV === 'development';
  const router = useRouter();
  const params = useParams<{ id?: string | string[] }>();
  const session = useAuthStore((state) => state.session);
  const [mounted, setMounted] = useState(false);

  const productId = useMemo(() => {
    const rawId = params?.id;

    if (typeof rawId === 'string') {
      return rawId;
    }

    if (Array.isArray(rawId)) {
      return rawId[0];
    }

    return undefined;
  }, [params]);

  useEffect(() => {
    queueMicrotask(() => {
      setMounted(true);
    });
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    if (!session) {
      router.replace('/login');
    }
  }, [mounted, router, session]);

  const productQuery = useQuery({
    queryKey: ['product-dashboard', productId, session?.user.id],
    queryFn: async (): Promise<DashboardLoadState> => {
      const details = await getProductDetails(productId!, session!.accessToken);

      return {
        productCategory: details.product.category?.name ?? 'Sem categoria',
        productDescription: details.product.description,
        productImage: details.product.image,
        productName: details.product.name,
        currentStock: details.dashboard.currentStock,
        alertDaysBefore: details.dashboard.alertDaysBefore,
        averageDailySales: details.dashboard.averageDailySales,
        estimatedDaysLeft: details.dashboard.estimatedDaysLeft,
        recentMovements: details.dashboard.recentMovements,
        totalEntries: details.dashboard.summary.totalEntries,
        totalOutputs: details.dashboard.summary.totalOutputs,
      };
    },
    enabled: mounted && Boolean(session?.accessToken && productId),
    staleTime: 0,
    refetchOnWindowFocus: !isDev,
    refetchOnMount: isDev ? false : 'always',
    retry: false,
  });

  const dashboard = productQuery.data;

  const stockSeries = useMemo<StockPoint[]>(() => {
    if (!dashboard) {
      return [];
    }

    const movements = [...dashboard.recentMovements].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() -
        new Date(b.createdAt).getTime(),
    );

    if (!movements.length) {
      return [
        {
          date: new Date().toLocaleDateString('pt-BR'),
          stock: dashboard.currentStock,
        },
      ];
    }

    let runningStock = dashboard.currentStock;

    const calculated = [...movements]
      .reverse()
      .map((movement) => {
        const stockAfter = runningStock;

        runningStock =
          movement.type === 'in'
            ? Math.max(runningStock - movement.quantity, 0)
            : runningStock + movement.quantity;

        return {
          createdAt: movement.createdAt,
          stockAfter,
        };
      })
      .reverse();

    const groupedByDay = new Map<
      string,
      { date: string; stock: number }
    >();

    calculated.forEach((item) => {
      const date = new Date(item.createdAt).toLocaleDateString(
        'pt-BR',
      );

      groupedByDay.set(date, {
        date,
        stock: item.stockAfter,
      });
    });

    return Array.from(groupedByDay.values());
  }, [dashboard]);

  const groupedMovements = useMemo(() => {
    if (!dashboard) {
      return [] as Array<[string, ProductDashboardMovement[]]>;
    }

    const grouped = dashboard.recentMovements.reduce<Record<string, ProductDashboardMovement[]>>((accumulator, movement) => {
      const label = new Date(movement.createdAt).toLocaleDateString('pt-BR');

      if (!accumulator[label]) {
        accumulator[label] = [];
      }

      accumulator[label].push(movement);
      return accumulator;
    }, {});

    return Object.entries(grouped).reverse();
  }, [dashboard]);

  const chartStats = useMemo(() => {
    if (!dashboard) {
      return null;
    }

    const values = stockSeries.length
      ? stockSeries.map((movement) => movement.stock).concat(dashboard.currentStock)
      : [dashboard.currentStock];

    const max = Math.max(...values, 1);
    const min = Math.max(Math.min(...values), 0);

    return { max, min };
  }, [dashboard, stockSeries]);

  if (!mounted || !session) {
    return <PageShell loading />;
  }

  if (!productId) {
    return <PageShell errorMessage="Produto inválido." />;
  }

  if (productQuery.isLoading) {
    return <PageShell loading />;
  }

  if (productQuery.isError || !dashboard) {
    const message = productQuery.error instanceof Error ? productQuery.error.message : 'Nao foi possivel carregar o produto.';

    return (
      <PageShell
        errorMessage={message}
        onRetry={() => productQuery.refetch()}
      />
    );
  }

  const status = getStatusBadge(dashboard.currentStock, dashboard.estimatedDaysLeft, dashboard.alertDaysBefore);

  return (
    <main className="relative min-h-screen w-full px-5 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-8">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.16),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.1),transparent_28%),linear-gradient(180deg,rgba(245,247,251,0.96),rgba(245,247,251,0.98))]" />

      <div className="space-y-6 reveal-up">
        <header className="surface-card flex flex-col gap-6 rounded-3xl border border-stroke p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 overflow-hidden rounded-3xl bg-slate-50 shadow-inner ring-1 ring-slate-100 sm:h-24 sm:w-24">
              {dashboard.productImage && dashboard.productImage !== NO_PHOTO_IMAGE ? (
                <img src={dashboard.productImage} alt={dashboard.productName} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center text-slate-300">
                  <ImageIcon size={34} strokeWidth={1.5} />
                </div>
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-soft px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted">
                  Produto
                </span>
                <span className="rounded-full bg-accent-soft px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-accent">
                  {dashboard.productCategory}
                </span>
                <span className={`rounded-full px-3 py-1 text-[10px] font-bold tracking-wider ${status.className}`}>
                  {status.label}
                </span>
              </div>

              <h1 className="mt-3 text-3xl font-black tracking-tight text-ink sm:text-4xl">{dashboard.productName}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-muted sm:text-base">{dashboard.productDescription}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/history"
              className="inline-flex items-center gap-2 rounded-xl bg-(image:--brand-gradient) px-4 py-3 text-sm font-bold text-white shadow-[0_16px_32px_-22px_rgba(15,23,42,0.75)] ring-1 ring-white/15 transition-all hover:-translate-y-0.5"
            >
              <Clock3 size={16} />
              Histórico geral
            </Link>
          </div>
        </header>

        <section className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
          <article className="surface-card p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">Gráfico de estoque</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-ink">Últimas movimentações e tendência</h2>
              </div>
              <div className="rounded-2xl bg-soft px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted">Média diária</p>
                <p className="mt-1 text-2xl font-black text-ink">{formatMetric(dashboard.averageDailySales)}</p>
              </div>
            </div>

            <div className="mt-6">
              {stockSeries.length && chartStats ? (
                <StockChart points={stockSeries} max={chartStats.max} min={chartStats.min} currentStock={dashboard.currentStock} />
              ) : (
                <EmptyChart currentStock={dashboard.currentStock} />
              )}
            </div>
          </article>

          <div className="space-y-5">
            <article className="surface-card p-5 sm:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">Dashboard do produto</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <MetricCard
                  icon={Package2}
                  label="Estoque atual"
                  value={String(dashboard.currentStock)}
                  accent="text-blue-600"
                  tone="bg-blue-50"
                />
                <MetricCard
                  icon={TrendingUp}
                  label="Total de entradas"
                  value={String(dashboard.totalEntries)}
                  accent="text-emerald-600"
                  tone="bg-emerald-50"
                />
                <MetricCard
                  icon={TrendingDown}
                  label="Total de saídas"
                  value={String(dashboard.totalOutputs)}
                  accent="text-rose-600"
                  tone="bg-rose-50"
                />
                <MetricCard
                  icon={CalendarClock}
                  label="Previsão de dias restantes"
                  value={dashboard.estimatedDaysLeft === null ? 'Sem previsão' : `${formatDays(dashboard.estimatedDaysLeft)} dias`}
                  accent={status.accent}
                  tone={status.tone}
                />
              </div>
            </article>

            <article className="surface-card p-5 sm:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">Leitura rápida</p>
              <div className="mt-5 space-y-4">
                <InfoRow icon={BarChart3} label="Média de saída diária" value={formatMetric(dashboard.averageDailySales)} />
                <InfoRow icon={Sparkles} label="Dias para alerta" value={`${dashboard.alertDaysBefore} dias`} />
                <InfoRow icon={ArrowUpRight} label="Tendência atual" value={status.label} />
              </div>
            </article>
          </div>
        </section>

        <section className="surface-card p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">Histórico de movimentações</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-ink">Últimos lançamentos do produto</h2>
            </div>
            <span className="rounded-full bg-soft px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted">
              {dashboard.recentMovements.length} registros
            </span>
          </div>

          <div className="mt-6 space-y-10">
            {groupedMovements.length ? (
              groupedMovements.map(([dateLabel, movements]) => (
                <article key={dateLabel} className="space-y-4">
                  <header className="flex items-center gap-4">
                    <div className="rounded-full border border-stroke bg-white px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted shadow-sm">
                      {dateLabel}
                    </div>
                    <span className="h-px flex-1 bg-stroke" />
                  </header>

                  <div className="relative ml-6 space-y-4 border-l border-stroke pl-6">
                    {movements.map((movement) => {
                      const isEntry = movement.type === 'in';

                      return (
                        <div key={movement.id} className="relative">
                          <div
                            className={`absolute top-5 h-3 w-3 -translate-x-1/2 rounded-full ${isEntry ? 'bg-emerald-500' : 'bg-rose-500'}`}
                            style={{ left: '-37px' }}
                          />

                          <div className="surface-card flex flex-col gap-4 p-5 transition-colors hover:bg-(--surface-2) sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${isEntry ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                {isEntry ? <ArrowDownLeft size={22} /> : <ArrowUpRight size={22} />}
                              </div>
                              <div>
                                <p className="text-base font-bold text-ink">
                                  {isEntry ? 'Entrada' : 'Saída'} de {movement.quantity} unidades
                                </p>
                                <p className="mt-1 text-xs font-medium text-muted">
                                  {new Date(movement.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-1">
                              <span className={`text-xl font-black tracking-tight ${isEntry ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {isEntry ? '+' : '-'}{movement.quantity}
                              </span>
                              <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Unidades</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </article>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-stroke bg-(--surface-2) py-16 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white text-muted shadow-sm">
                  <Clock3 size={32} strokeWidth={1.5} />
                </div>
                <p className="text-base font-bold text-ink">Sem movimentações recentes</p>
                <p className="mt-1 text-sm font-medium text-muted">As próximas entradas e saídas aparecem aqui automaticamente.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function PageShell({
  errorMessage,
  loading = false,
  onRetry,
}: {
  errorMessage?: string;
  loading?: boolean;
  onRetry?: () => void;
}) {
  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-10 sm:px-8">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.14),transparent_32%),linear-gradient(180deg,rgba(245,247,251,0.96),rgba(245,247,251,0.98))]" />
      <section className="surface-card w-full rounded-3xl border border-stroke p-6 text-center sm:p-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-soft text-muted">
          <Package2 size={30} />
        </div>
        <h1 className="mt-5 text-2xl font-black tracking-tight text-ink">
          {loading ? 'Carregando produto...' : errorMessage ?? 'Abrindo produto...'}
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-muted">
          {loading
            ? 'Estamos preparando os dados do dashboard e do histórico de movimentações.'
            : errorMessage ?? 'Redirecionando para a página do produto.'}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-2 rounded-xl bg-(image:--brand-gradient) px-4 py-3 text-sm font-bold text-white shadow-[0_16px_32px_-22px_rgba(15,23,42,0.75)] ring-1 ring-white/15 transition-all hover:-translate-y-0.5"
            >
              Tentar novamente
            </button>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function StockChart({
  currentStock,
  max,
  min,
  points,
}: {
  currentStock: number;
  max: number;
  min: number;
  points: StockPoint[];
}) {
  const chartPadding = 5;
  const width = 100 - chartPadding * 2;
  const height = 40;
  const range = Math.max(max - min, 1);
  const step = points.length > 1 ? width / (points.length - 1) : 0;

  const coordinates = points.map((point, index) => {
    const x = chartPadding + index * step;
    const normalized = (point.stock - min) / range;
    const y = height - chartPadding - normalized * (height - chartPadding * 2);

    return { ...point, x, y };
  });

  const linePoints = coordinates.map((point) => `${point.x},${point.y}`).join(' ');
  const areaPath = coordinates.length
    ? `${coordinates.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')} L ${coordinates.at(-1)?.x ?? 95} ${height - chartPadding} L ${coordinates[0].x} ${height - chartPadding} Z`
    : '';

  return (
    <div className="rounded-3xl border border-stroke bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.92))] p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-4 text-xs font-bold uppercase tracking-[0.18em] text-muted">
        <span>Evolução do estoque</span>
        <span className="rounded-full bg-white px-3 py-1 shadow-sm">Atual: {currentStock}</span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-stroke bg-white p-3 shadow-[0_20px_40px_-35px_rgba(8,11,18,0.4)]">
        <svg viewBox="0 0 100 40" className="h-40 w-full">
          <defs>
            <linearGradient id="stockArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(59,130,246,0.28)" />
              <stop offset="100%" stopColor="rgba(59,130,246,0.03)" />
            </linearGradient>
          </defs>

          {[0, 1, 2, 3].map((line) => (
            <line
              key={line}
              x1="5"
              x2="95"
              y1={5 + line * 10}
              y2={5 + line * 10}
              stroke="rgba(148,163,184,0.18)"
              strokeDasharray="2 3"
            />
          ))}

          {coordinates.length ? <path d={areaPath} fill="url(#stockArea)" /> : null}
          {coordinates.length ? <polyline points={linePoints} fill="none" stroke="rgba(37,99,235,0.92)" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" /> : null}

          {coordinates.map((point) => (
            <g key={point.date}>
              <circle cx={point.x} cy={point.y} r="1.8" fill="white" stroke="rgba(37,99,235,0.98)" strokeWidth="0.7" />
            </g>
          ))}
        </svg>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-medium text-muted">
        {coordinates.length ? (
          <>
            <span className="rounded-full bg-soft px-3 py-1">Menor: {Math.floor(min)}</span>
            <span className="rounded-full bg-soft px-3 py-1">Maior: {Math.ceil(max)}</span>
          </>
        ) : (
          <span className="rounded-full bg-soft px-3 py-1">Sem movimentações para desenhar a curva</span>
        )}
      </div>
    </div>
  );
}

function EmptyChart({ currentStock }: { currentStock: number }) {
  return (
    <div className="rounded-3xl border border-dashed border-stroke bg-(--surface-2) p-8 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-muted shadow-sm">
        <BarChart3 size={30} strokeWidth={1.5} />
      </div>
      <h3 className="mt-5 text-lg font-black tracking-tight text-ink">Curva de estoque indisponível</h3>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-7 text-muted">
        Ainda não existem movimentações suficientes para desenhar o gráfico. O estoque atual permanece em {currentStock} unidades.
      </p>
    </div>
  );
}

function MetricCard({
  accent,
  icon: Icon,
  label,
  tone,
  value,
}: {
  accent: string;
  icon: ComponentType<{ size?: number }>;
  label: string;
  tone: string;
  value: string;
}) {
  return (
    <article className="flex items-center justify-between gap-4 rounded-2xl border border-stroke bg-white p-4 shadow-[0_16px_32px_-28px_rgba(8,11,18,0.45)]">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted">{label}</p>
        <p className={`mt-2 text-2xl font-black tracking-tight ${accent}`}>{value}</p>
      </div>
      <div className={`grid h-12 w-12 place-items-center rounded-2xl ${tone} ${accent}`}>
        <Icon size={22} />
      </div>
    </article>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ size?: number }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-(--surface-2) px-4 py-4">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-white text-ink shadow-sm">
          <Icon size={18} />
        </div>
        <p className="text-sm font-semibold text-ink">{label}</p>
      </div>
      <span className="text-sm font-black text-muted">{value}</span>
    </div>
  );
}

function getStatusBadge(currentStock: number, estimatedDaysLeft: number | null, alertDaysBefore: number) {
  if (currentStock <= 0) {
    return {
      accent: 'text-rose-600',
      className: 'bg-rose-100 text-rose-700',
      label: 'Sem estoque',
      tone: 'bg-rose-50',
    };
  }

  if (estimatedDaysLeft !== null && estimatedDaysLeft <= alertDaysBefore) {
    return {
      accent: 'text-orange-600',
      className: 'bg-orange-100 text-orange-700',
      label: 'Atenção',
      tone: 'bg-orange-50',
    };
  }

  return {
    accent: 'text-emerald-600',
    className: 'bg-emerald-100 text-emerald-700',
    label: 'Estoque OK',
    tone: 'bg-emerald-50',
  };
}

function formatMetric(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 1,
  }).format(value);
}

function formatDays(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 1,
  }).format(Math.max(value, 0));
}