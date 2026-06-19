"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useMemo, type ComponentType } from 'react';
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
  const params = useParams<{ id?: string | string[] }>();
  const session = useAuthStore((state) => state.session);

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
    enabled: Boolean(session?.accessToken && productId),
    staleTime: 30_000,
    placeholderData: (previousData) => previousData,
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

  if (!session) {
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

      <div className="space-y-5 reveal-up">
        <header className="surface-card p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-(--soft)">
                {dashboard.productImage && dashboard.productImage !== NO_PHOTO_IMAGE ? (
                  <Image
                    src={dashboard.productImage}
                    alt={dashboard.productName}
                    width={48}
                    height={48}
                    unoptimized
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-(--muted)">
                    <ImageIcon size={18} strokeWidth={1.5} />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-(--accent-soft) px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-(--accent)">
                    {dashboard.productCategory}
                  </span>
                  <span className={`rounded-full border-2 px-2.5 py-0.5 text-[10px] font-bold tracking-wider ${status.className}`}>
                    {status.label}
                  </span>
                </div>
                <h1 className="mt-1.5 text-lg font-bold tracking-tight text-(--ink) sm:text-xl">{dashboard.productName}</h1>
                <p className="mt-0.5 max-w-xl text-xs leading-6 text-(--muted)">{dashboard.productDescription}</p>
              </div>
            </div>
            <Link
              href="/history"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-(--ink) px-3.5 py-2 text-xs font-bold text-white transition-all hover:brightness-125"
            >
              <Clock3 size={14} />
              Histórico geral
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MetricCard
              icon={Package2}
              label="Estoque atual"
              value={String(dashboard.currentStock)}
              accent="text-(--ink)"
              tone="bg-(--soft)"
            />
            <MetricCard
              icon={TrendingUp}
              label="Entradas"
              value={String(dashboard.totalEntries)}
              accent="text-(--ok)"
              tone="bg-(--ok-soft)"
            />
            <MetricCard
              icon={TrendingDown}
              label="Saídas"
              value={String(dashboard.totalOutputs)}
              accent="text-(--critical)"
              tone="bg-(--critical-soft)"
            />
            <MetricCard
              icon={CalendarClock}
              label="Previsão"
              value={dashboard.estimatedDaysLeft === null ? 'Sem previsão' : `${formatDays(dashboard.estimatedDaysLeft)} dias`}
              accent={status.accent}
              tone={status.tone}
            />
          </div>
        </header>

        <section className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
          <article className="surface-card p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-(--muted)">Gráfico de estoque</p>
                <h2 className="mt-1 text-lg font-bold tracking-tight text-(--ink)">Últimas movimentações</h2>
              </div>
              <div className="rounded-lg bg-(--soft) px-3 py-2">
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-(--muted)">Média diária</p>
                <p className="mt-0.5 text-base font-bold text-(--ink)">{formatMetric(dashboard.averageDailySales)}</p>
              </div>
            </div>

            <div className="mt-4">
              {stockSeries.length && chartStats ? (
                <StockChart points={stockSeries} max={chartStats.max} min={chartStats.min} currentStock={dashboard.currentStock} />
              ) : (
                <EmptyChart currentStock={dashboard.currentStock} />
              )}
            </div>
          </article>

          <div className="space-y-4">
            <article className="surface-card p-5 sm:p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-(--muted)">Leitura rápida</p>
              <div className="mt-4 space-y-3">
                <InfoRow icon={BarChart3} label="Média de saída diária" value={formatMetric(dashboard.averageDailySales)} />
                <InfoRow icon={Sparkles} label="Dias para alerta" value={`${dashboard.alertDaysBefore} dias`} />
                <InfoRow icon={ArrowUpRight} label="Tendência atual" value={status.label} />
              </div>
            </article>
          </div>
        </section>

        <section className="surface-card p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-(--muted)">Histórico de movimentações</p>
              <h2 className="mt-1 text-lg font-bold tracking-tight text-(--ink)">Últimos lançamentos do produto</h2>
            </div>
            <span className="shrink-0 rounded-full bg-(--soft) px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-(--muted)">
              {dashboard.recentMovements.length} registros
            </span>
          </div>

          <div className="mt-5 space-y-6">
            {groupedMovements.length ? (
              groupedMovements.map(([dateLabel, movements]) => (
                <article key={dateLabel} className="space-y-3">
                  <header className="flex items-center gap-3">
                    <div className="rounded-full border-2 border-(--stroke) bg-(--card) px-3 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-(--muted)">
                      {dateLabel}
                    </div>
                    <span className="h-px flex-1 bg-(--stroke)" />
                  </header>

                  <div className="relative ml-5 space-y-3 border-l-2 border-(--stroke) pl-5">
                    {movements.map((movement) => {
                      const isEntry = movement.type === 'in';

                      return (
                        <div key={movement.id} className="relative">
                          <div
                            className={`absolute top-4 h-2.5 w-2.5 -translate-x-1/2 rounded-full border-2 ${isEntry ? 'border-(--ok) bg-(--ok)' : 'border-(--critical) bg-(--critical)'}`}
                            style={{ left: '-31px' }}
                          />

                          <div className="flex items-center justify-between gap-3 rounded-lg border-2 border-(--stroke) bg-(--card) px-4 py-3 transition-colors hover:bg-(--surface-2)">
                            <div className="flex items-center gap-3">
                              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${isEntry ? 'bg-(--ok-soft) text-(--ok)' : 'bg-(--critical-soft) text-(--critical)'}`}>
                                {isEntry ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-(--ink)">
                                  {isEntry ? 'Entrada' : 'Saída'} de {movement.quantity} unidades
                                </p>
                                <p className="text-[11px] font-medium text-(--muted)">
                                  {new Date(movement.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>

                            <span className={`text-base font-bold tracking-tight ${isEntry ? 'text-(--ok)' : 'text-(--critical)'}`}>
                              {isEntry ? '+' : '-'}{movement.quantity}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </article>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-(--stroke) bg-(--surface-2) py-12 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-(--card) text-(--muted)">
                  <Clock3 size={24} strokeWidth={1.5} />
                </div>
                <p className="text-sm font-bold text-(--ink)">Sem movimentações recentes</p>
                <p className="mt-1 text-xs font-medium text-(--muted)">As próximas entradas e saídas aparecem aqui automaticamente.</p>
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
      <section className="surface-card w-full p-6 text-center sm:p-8">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-(--soft) text-(--muted)">
          <Package2 size={22} />
        </div>
        <h1 className="mt-4 text-xl font-bold tracking-tight text-(--ink)">
          {loading ? 'Carregando produto...' : errorMessage ?? 'Abrindo produto...'}
        </h1>
        <p className="mx-auto mt-2 max-w-md text-xs leading-6 text-(--muted)">
          {loading
            ? 'Estamos preparando os dados do dashboard e do histórico de movimentações.'
            : errorMessage ?? 'Redirecionando para a página do produto.'}
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-2 rounded-lg bg-(--ink) px-4 py-2.5 text-xs font-bold text-white transition-all hover:brightness-125"
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
    <div className="rounded-lg border-2 border-(--stroke) bg-(--card) p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-4 text-[9px] font-bold uppercase tracking-[0.18em] text-(--muted)">
        <span>Evolução do estoque</span>
        <span className="rounded-lg border-2 border-(--stroke) bg-(--card) px-2.5 py-0.5">Atual: {currentStock}</span>
      </div>

      <div className="overflow-hidden rounded-lg border-2 border-(--stroke) bg-(--card) p-2">
        <svg viewBox="0 0 100 40" className="h-32 w-full">
          <defs>
            <linearGradient id="stockArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(217,119,6,0.28)" />
              <stop offset="100%" stopColor="rgba(217,119,6,0.03)" />
            </linearGradient>
          </defs>

          {[0, 1, 2, 3].map((line) => (
            <line
              key={line}
              x1="5"
              x2="95"
              y1={5 + line * 10}
              y2={5 + line * 10}
              stroke="rgba(139,140,154,0.18)"
              strokeDasharray="2 3"
            />
          ))}

          {coordinates.length ? <path d={areaPath} fill="url(#stockArea)" /> : null}
          {coordinates.length ? <polyline points={linePoints} fill="none" stroke="rgba(217,119,6,0.92)" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" /> : null}

          {coordinates.map((point) => (
            <g key={point.date}>
              <circle cx={point.x} cy={point.y} r="1.8" fill="white" stroke="rgba(217,119,6,0.98)" strokeWidth="0.7" />
            </g>
          ))}
        </svg>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-medium text-(--muted)">
        {coordinates.length ? (
          <>
            <span className="rounded-lg bg-(--soft) px-2.5 py-0.5">Menor: {Math.floor(min)}</span>
            <span className="rounded-lg bg-(--soft) px-2.5 py-0.5">Maior: {Math.ceil(max)}</span>
          </>
        ) : (
          <span className="rounded-lg bg-(--soft) px-2.5 py-0.5">Sem movimentações para desenhar a curva</span>
        )}
      </div>
    </div>
  );
}

function EmptyChart({ currentStock }: { currentStock: number }) {
  return (
    <div className="rounded-lg border-2 border-dashed border-(--stroke) bg-(--surface-2) p-6 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-(--card) text-(--muted)">
        <BarChart3 size={22} strokeWidth={1.5} />
      </div>
      <h3 className="mt-4 text-base font-bold tracking-tight text-(--ink)">Curva de estoque indisponível</h3>
      <p className="mx-auto mt-1.5 max-w-md text-xs leading-6 text-(--muted)">
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
    <article className="flex items-center justify-between gap-3 rounded-lg border-2 border-(--stroke) bg-(--card) px-3.5 py-3">
      <div>
        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-(--muted)">{label}</p>
        <p className={`mt-1 text-lg font-bold tracking-tight ${accent}`}>{value}</p>
      </div>
      <div className={`grid h-9 w-9 place-items-center rounded-lg ${tone} ${accent}`}>
        <Icon size={16} />
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
    <div className="flex items-center justify-between gap-3 rounded-lg border-2 border-(--stroke) bg-(--soft) px-3.5 py-3">
      <div className="flex items-center gap-2.5">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-(--card) text-(--ink)">
          <Icon size={15} />
        </div>
        <p className="text-xs font-semibold text-(--ink)">{label}</p>
      </div>
      <span className="text-xs font-bold text-(--muted)">{value}</span>
    </div>
  );
}

function getStatusBadge(currentStock: number, estimatedDaysLeft: number | null, alertDaysBefore: number) {
  if (currentStock <= 0) {
    return {
      accent: 'text-(--critical)',
      className: 'border-(--critical) bg-(--critical-soft) text-(--critical)',
      label: 'Sem estoque',
      tone: 'bg-(--critical-soft)',
    };
  }

  if (estimatedDaysLeft !== null && estimatedDaysLeft <= alertDaysBefore) {
    return {
      accent: 'text-(--low)',
      className: 'border-(--low) bg-(--low-soft) text-(--low)',
      label: 'Atenção',
      tone: 'bg-(--low-soft)',
    };
  }

  return {
    accent: 'text-(--ok)',
    className: 'border-(--ok) bg-(--ok-soft) text-(--ok)',
    label: 'Estoque OK',
    tone: 'bg-(--ok-soft)',
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