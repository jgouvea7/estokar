"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useMemo, type ComponentType } from 'react';
import { useQueries } from '@tanstack/react-query';
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
import { getProductDetails, getProductTimeline } from '@/lib/api/products';
import { StockTimelineChart } from '@/components/dashboard/stock-timeline-chart';
import type { ProductDashboardMovement } from '@/lib/types';
import { useAuthStore } from '@/store/auth-store';
import { formatMetric, formatDays } from '@/lib/utils';

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
  hasExpiration?: boolean;
  expirationDate?: string | null;
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

  const results = useQueries({
    queries: [
      {
        queryKey: ['product-dashboard', productId, session?.user.id],
        queryFn: async (): Promise<DashboardLoadState> => {
          const details = await getProductDetails(productId!, session!.accessToken);

          return {
            productCategory: details.product.category?.name ?? 'Sem categoria',
            productDescription: details.product.description ?? '',
            productImage: details.product.image,
            productName: details.product.name,
            currentStock: details.dashboard.currentStock,
            alertDaysBefore: details.dashboard.alertDaysBefore,
            averageDailySales: details.dashboard.averageDailySales,
            estimatedDaysLeft: details.dashboard.estimatedDaysLeft,
            recentMovements: details.dashboard.recentMovements,
            totalEntries: details.dashboard.summary.totalEntries,
            totalOutputs: details.dashboard.summary.totalOutputs,
            hasExpiration: details.product.hasExpiration,
            expirationDate: details.product.expirationDate,
          };
        },
        enabled: Boolean(session?.accessToken && productId),
        staleTime: 30_000,
        placeholderData: (previousData: DashboardLoadState | undefined) => previousData,
        refetchOnWindowFocus: !isDev,
        refetchOnMount: isDev ? false : 'always',
        retry: false,
      },
      {
        queryKey: ['product-timeline', productId, session?.user.id],
        queryFn: () => getProductTimeline(productId!, session!.accessToken),
        enabled: Boolean(session?.accessToken && productId),
        staleTime: 30_000,
        refetchOnWindowFocus: !isDev,
        retry: false,
      },
    ],
  });

  const productQuery = results[0];
  const timelineQuery = results[1];
  const dashboard = productQuery.data;

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
                  {dashboard.hasExpiration && dashboard.expirationDate && (
                    <span className="rounded-full bg-(--critical-soft) px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-(--critical)">
                      Validade: {new Date(dashboard.expirationDate).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
                <h1 className="mt-1.5 text-lg font-bold tracking-tight text-(--ink) sm:text-xl">{dashboard.productName}</h1>
                <p className="mt-0.5 max-w-xl text-xs leading-6 text-(--muted)">{dashboard.productDescription || 'Sem descrição.'}</p>
              </div>
            </div>
            <Link
              href="/history"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-(--button) px-3.5 py-2 text-xs font-bold text-white transition-all hover:brightness-125"
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
            <StockTimelineChart
              data={timelineQuery.data?.points ?? []}
              title="Últimas movimentações"
            />
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
              className="inline-flex items-center gap-2 rounded-lg bg-(--button) px-4 py-2.5 text-xs font-bold text-white transition-all hover:brightness-125"
            >
              Tentar novamente
            </button>
          ) : null}
        </div>
      </section>
    </main>
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

