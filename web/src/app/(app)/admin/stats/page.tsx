"use client";

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth-store';
import { getAdminStats } from '@/lib/api/admin';
import { StatsCards } from '@/components/admin/stats-cards';
import type { AdminStatsPeriod } from '@/lib/types';
import toast from 'react-hot-toast';
import { RefreshCcw } from 'lucide-react';

export default function AdminStatsPage() {
  const session = useAuthStore((state) => state.session);
  const [period, setPeriod] = useState<AdminStatsPeriod>('total');

  const statsQuery = useQuery({
    queryKey: ['admin-stats', session?.user.id, period],
    enabled: Boolean(session),
    queryFn: ({ signal }) => getAdminStats({
      accessToken: session!.accessToken,
      period,
      signal,
    }),
    staleTime: 60000,
    gcTime: 300000,
  });

  const stats = statsQuery.data ?? null;
  const isInitialLoading = statsQuery.isLoading && !statsQuery.data;
  const isRefreshing = statsQuery.isFetching && Boolean(statsQuery.data);

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Estatísticas Gerais</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Visão geral do ecossistema Estokar.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
            {([
              { label: 'Total', value: 'total' },
              { label: 'Mensal', value: 'monthly' },
            ] as Array<{ label: string; value: AdminStatsPeriod }>).map((option) => (
              <button
                key={option.value}
                onClick={() => setPeriod(option.value)}
                className={`rounded-2xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${period === option.value
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
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
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition-all hover:bg-slate-50 active:scale-95 disabled:opacity-50"
            title="Recarregar dados"
            type="button"
          >
            <RefreshCcw size={18} className={statsQuery.isFetching ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      {statsQuery.isError && !statsQuery.data ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Não foi possível carregar as estatísticas agora. Tente novamente em instantes.
          </p>
        </div>
      ) : (
        <StatsCards stats={stats} isLoading={isInitialLoading} />
      )}

      {stats && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Resumo do periodo</p>
          <p className="mt-2 text-sm font-medium text-slate-500">
            {period === 'monthly'
              ? 'Contagem baseada em registros criados no mês atual.'
              : 'Contagem acumulada desde o início do sistema.'}
          </p>
          {isRefreshing && (
            <p className="mt-3 text-xs font-bold uppercase tracking-wider text-blue-500">Atualizando...</p>
          )}
        </div>
      )}
    </div>
  );
}
