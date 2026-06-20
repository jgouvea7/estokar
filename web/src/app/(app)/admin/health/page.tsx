'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth-store';
import { getAdminHealth } from '@/lib/api/admin';
import { Activity, Database, Clock, MemoryStick, RefreshCcw } from 'lucide-react';

export default function AdminHealthPage() {
  const accessToken = useAuthStore((state) => state.session?.accessToken);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-health'],
    queryFn: () => getAdminHealth(accessToken!),
    enabled: Boolean(accessToken),
    refetchInterval: 15_000,
  });

  function formatUptime(seconds: number) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  }

  function formatBytes(bytes: number) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-(--ink)">Saúde do Sistema</h1>
          <p className="text-xs font-bold text-(--muted) uppercase tracking-wider">
            Monitoramento do servidor backend
          </p>
        </div>
        <button onClick={() => refetch()} className="flex items-center gap-1.5 rounded-lg border-2 border-(--stroke) bg-(--card) px-3.5 py-2 text-xs font-bold text-(--ink) transition-colors hover:bg-(--soft)">
          <RefreshCcw size={14} /> Atualizar
        </button>
      </header>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="surface-card h-24 rounded-3xl bg-(--soft)" />
          ))}
        </div>
      ) : data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="surface-card flex items-center gap-3 p-4 rounded-xl border-2 border-(--stroke)">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${data.status === 'healthy' ? 'bg-(--ok-soft) text-(--ok)' : 'bg-(--critical-soft) text-(--critical)'}`}>
                <Activity size={18} />
              </div>
              <div>
                <p className="text-lg font-bold leading-none text-(--ink) capitalize">{data.status}</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-(--muted)">Status</p>
              </div>
            </div>

            <div className="surface-card flex items-center gap-3 p-4 rounded-xl border-2 border-(--stroke)">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${data.database === 'connected' ? 'bg-(--ok-soft) text-(--ok)' : 'bg-(--critical-soft) text-(--critical)'}`}>
                <Database size={18} />
              </div>
              <div>
                <p className="text-lg font-bold leading-none text-(--ink) capitalize">{data.database}</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-(--muted)">Banco de Dados</p>
              </div>
            </div>

            <div className="surface-card flex items-center gap-3 p-4 rounded-xl border-2 border-(--stroke)">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-(--accent-soft) text-(--accent)">
                <Clock size={18} />
              </div>
              <div>
                <p className="text-lg font-bold leading-none text-(--ink)">{formatUptime(data.uptime)}</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-(--muted)">Tempo Online</p>
              </div>
            </div>

            <div className="surface-card flex items-center gap-3 p-4 rounded-xl border-2 border-(--stroke)">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-(--accent-soft) text-(--accent)">
                <MemoryStick size={18} />
              </div>
              <div>
                <p className="text-lg font-bold leading-none text-(--ink)">
                  {data.memory ? formatBytes(data.memory.heapUsed) : 'N/A'}
                </p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-(--muted)">Memória (Heap)</p>
              </div>
            </div>
          </div>

          <div className="surface-card rounded-xl border-2 border-(--stroke) p-6">
            <h2 className="text-sm font-bold text-(--ink) mb-4">Detalhes do Servidor</h2>
            <div className="space-y-3">
              {data.memory && (
                <>
                  <div className="flex justify-between rounded-lg bg-(--soft) px-4 py-2.5">
                    <span className="text-xs font-bold text-(--muted)">RSS</span>
                    <span className="text-xs font-bold text-(--ink)">{formatBytes(data.memory.rss)}</span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-(--soft) px-4 py-2.5">
                    <span className="text-xs font-bold text-(--muted)">Heap Total</span>
                    <span className="text-xs font-bold text-(--ink)">{formatBytes(data.memory.heapTotal)}</span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-(--soft) px-4 py-2.5">
                    <span className="text-xs font-bold text-(--muted)">Heap Usado</span>
                    <span className="text-xs font-bold text-(--ink)">{formatBytes(data.memory.heapUsed)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between rounded-lg bg-(--soft) px-4 py-2.5">
                <span className="text-xs font-bold text-(--muted)">Última verificação</span>
                <span className="text-xs font-bold text-(--ink)">
                  {new Date(data.timestamp).toLocaleTimeString('pt-BR')}
                </span>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
