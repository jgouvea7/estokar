"use client";

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth-store';
import { getAdminStats } from '@/lib/api/admin';
import type { AdminStatsPeriod } from '@/lib/types';

const StatsCards = dynamic(() => import('@/components/admin/stats-cards').then((m) => m.StatsCards));
import { RefreshCcw } from 'lucide-react';

export default function AdminStatsPage() {
  const session = useAuthStore((state) => state.session);
  const [period, setPeriod] = useState<AdminStatsPeriod>('total');
  const sessionRef = useRef(session);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const statsQuery = useQuery({
    queryKey: ['admin-stats', period],
    enabled: true,
    queryFn: ({ signal }) => {
      const currentSession = sessionRef.current;
      if (!currentSession) {
        return Promise.reject(new Error('Sessão não disponível'));
      }
      return getAdminStats({
        accessToken: currentSession.accessToken,
        period,
        signal,
      });
    },
    staleTime: 60000,
    gcTime: 300000,
    retry: 2,
    refetchOnMount: true,
  });

  const stats = statsQuery.data ?? null;
  const isInitialLoading = statsQuery.isLoading && !statsQuery.data;
  const isRefreshing = statsQuery.isFetching && Boolean(statsQuery.data);
  const isValid = Boolean(stats) || statsQuery.isError;

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-(--muted)">
            Visão geral do ecossistema Estokar.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border-2 border-(--stroke) bg-(--surface-2) p-1">
            {([
              { label: 'Total', value: 'total' },
              { label: 'Mensal', value: 'monthly' },
            ] as Array<{ label: string; value: AdminStatsPeriod }>).map((option) => (
              <button
                key={option.value}
                onClick={() => setPeriod(option.value)}
                className={`rounded-md px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider transition-all ${period === option.value
                    ? 'bg-(--card) text-(--ink)'
                    : 'text-(--muted) hover:text-(--ink)'
                  }`}
                type="button"
                aria-pressed={period === option.value}
              >
                {option.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => statsQuery.refetch()}
            disabled={statsQuery.isFetching}
            className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-(--stroke) bg-(--card) text-(--muted) transition-all hover:bg-(--soft) disabled:opacity-50"
            title="Recarregar dados"
            type="button"
          >
            <RefreshCcw size={16} className={statsQuery.isFetching ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      {statsQuery.isError && !statsQuery.data ? (
        <div className="rounded-xl border-2 border-(--stroke) bg-(--card) p-6">
          <p className="text-sm font-medium text-(--muted)">
            Não foi possível carregar as estatísticas agora. Tente novamente em instantes.
          </p>
        </div>
      ) : (
        <StatsCards stats={stats} isLoading={isInitialLoading} />
      )}

      {isValid && (
        <div className="rounded-xl border-2 border-(--stroke) bg-(--card) p-6">
          <p className="text-[10px] font-bold uppercase tracking-wider text-(--muted)">Resumo do periodo</p>
          {stats ? (
            <p className="mt-2 text-sm font-medium text-(--muted)">
              {period === 'monthly'
                ? 'Contagem baseada em registros criados no mês atual.'
                : 'Contagem acumulada desde o início do sistema.'}
            </p>
          ) : (
            <p className="mt-2 text-sm font-medium text-(--muted)">
              {statsQuery.isLoading ? 'Carregando dados...' : 'Nenhum dado disponível.'}
            </p>
          )}
          {isRefreshing && (
            <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-(--accent)">Atualizando...</p>
          )}
        </div>
      )}
    </div>
  );
}
