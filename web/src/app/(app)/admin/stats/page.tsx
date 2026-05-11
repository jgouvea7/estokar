"use client";

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { getAdminStats } from '@/lib/api/admin';
import { StatsCards } from '@/components/admin/stats-cards';
import type { AdminStats } from '@/lib/types';
import toast from 'react-hot-toast';
import { RefreshCcw } from 'lucide-react';

export default function AdminStatsPage() {
  const session = useAuthStore((state) => state.session);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async (options?: { signal?: AbortSignal; isActive?: () => boolean }) => {
    if (!session) return;

    if (options?.signal?.aborted) return;
    setIsLoading(true);
    try {
      const response = await getAdminStats(session.accessToken, options?.signal);
      if (options?.isActive && !options.isActive()) return;
      setStats(response);
    } catch (error) {
      if (options?.signal?.aborted) return;
      toast.error(error instanceof Error ? error.message : 'Falha ao carregar estatísticas.');
    } finally {
      if (options?.isActive && !options.isActive()) return;
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    fetchStats({
      signal: controller.signal,
      isActive: () => active,
    });

    return () => {
      active = false;
      controller.abort();
    };
  }, [session]);

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Estatísticas Gerais</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Visão geral do ecossistema Estokar.
          </p>
        </div>
        
        <button
          onClick={() => fetchStats()}
          disabled={isLoading}
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition-all hover:bg-slate-50 active:scale-95 disabled:opacity-50"
          title="Recarregar dados"
        >
          <RefreshCcw size={18} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </header>

      <StatsCards stats={stats} isLoading={isLoading} />
      
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">Distribuição de Usuários</h3>
          <p className="mt-1 text-sm font-medium text-slate-500">Proporção entre administradores e contas padrão.</p>
          
          <div className="mt-8 flex items-end gap-2 h-48">
            <div className="flex-1 flex flex-col items-center gap-2">
              <div 
                className="w-full rounded-t-2xl bg-blue-500 transition-all duration-1000"
                style={{ height: stats && stats.totalUsers > 0 ? `${(stats.totalAdmins / stats.totalUsers) * 100}%` : '0%' }}
              />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Admins</span>
            </div>
            <div className="flex-1 flex flex-col items-center gap-2">
              <div 
                className="w-full rounded-t-2xl bg-slate-400 transition-all duration-1000"
                style={{ height: stats && stats.totalUsers > 0 ? `${(stats.totalFree / stats.totalUsers) * 100}%` : '0%' }}
              />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Free</span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm flex flex-col justify-center">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Métricas de Engajamento</h3>
              <p className="mt-1 text-sm font-medium text-slate-500">Dados simulados baseados no crescimento atual.</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                  <span className="text-slate-400">Novos Usuários (Mês)</span>
                  <span className="text-blue-600">+12%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full w-[65%] rounded-full bg-blue-500" />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                  <span className="text-slate-400">Conversão Pro</span>
                  <span className="text-indigo-600">8.4%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full w-[35%] rounded-full bg-indigo-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
