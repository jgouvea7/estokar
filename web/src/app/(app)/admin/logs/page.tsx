'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth-store';
import { getAdminLogs } from '@/lib/api/admin';
import { ShieldCheck, UserMinus } from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';

const actionLabels: Record<string, { label: string; className: string }> = {
  PROMOTE_USER: { label: 'Promovido a Admin', className: 'text-(--ok) bg-(--ok-soft)' },
  DELETE_USER: { label: 'Usuário Removido', className: 'text-(--critical) bg-(--critical-soft)' },
};

export default function AdminLogsPage() {
  const accessToken = useAuthStore((state) => state.session?.accessToken);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-logs', page],
    queryFn: () => getAdminLogs({ page, perPage: 20, accessToken: accessToken! }),
    enabled: Boolean(accessToken),
  });

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="surface-card h-12 rounded-xl bg-(--soft)" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="surface-card h-16 rounded-xl bg-(--soft)" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
          <h1 className="text-2xl font-black text-(--ink)">Log de Atividades</h1>
          <p className="text-xs font-bold text-(--muted) uppercase tracking-wider">
            Auditoria de ações administrativas
          </p>
        </header>

      <div className="surface-card overflow-hidden rounded-xl border-2 border-(--stroke)">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-(--stroke) bg-(--soft) text-left text-[11px] font-bold uppercase tracking-wider text-(--muted)">
                <th className="px-5 py-3">Ação</th>
                <th className="px-5 py-3">Admin</th>
                <th className="px-5 py-3">Alvo</th>
                <th className="px-5 py-3">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--stroke)">
              {data?.data.map((log) => {
                const action = actionLabels[log.action] ?? { label: log.action, className: 'bg-(--soft) text-(--muted)' };
                return (
                  <tr key={log.id} className="transition-colors hover:bg-(--soft)">
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${action.className}`}>
                        {log.action === 'PROMOTE_USER' ? <ShieldCheck size={12} /> : <UserMinus size={12} />}
                        {action.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-bold text-(--ink)">{log.actorName}</td>
                    <td className="px-5 py-3 text-(--muted)">{log.targetUserName}</td>
                    <td className="px-5 py-3 text-(--muted) text-[11px]">
                      {new Date(log.createdAt).toLocaleDateString('pt-BR', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {data && data.meta.lastPage > 1 && (
        <Pagination currentPage={page} totalPages={data.meta.lastPage} onPageChange={setPage} />
      )}
    </div>
  );
}
