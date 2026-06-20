'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth-store';
import { getAdminMovements } from '@/lib/api/admin';
import { ArrowDownLeft, ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AdminMovementsPage() {
  const accessToken = useAuthStore((state) => state.session?.accessToken);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-movements', page],
    queryFn: () => getAdminMovements({ page, perPage: 20, accessToken: accessToken! }),
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
        <h1 className="text-2xl font-black text-(--ink)">Movimentações</h1>
        <p className="text-xs font-bold text-(--muted) uppercase tracking-wider">
          Todas as movimentações de estoque do sistema
        </p>
      </header>

      <div className="surface-card overflow-hidden rounded-xl border-2 border-(--stroke)">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-(--stroke) bg-(--soft) text-left text-[11px] font-bold uppercase tracking-wider text-(--muted)">
                <th className="px-5 py-3">Tipo</th>
                <th className="px-5 py-3">Produto</th>
                <th className="px-5 py-3">Usuário</th>
                <th className="px-5 py-3">Qtd</th>
                <th className="px-5 py-3">Contexto</th>
                <th className="px-5 py-3">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--stroke)">
              {data?.data.map((movement) => (
                <tr key={movement.id} className="transition-colors hover:bg-(--soft)">
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                      movement.type === 'in' ? 'bg-(--ok-soft) text-(--ok)' : 'bg-(--critical-soft) text-(--critical)'
                    }`}>
                      {movement.type === 'in' ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                      {movement.type === 'in' ? 'Entrada' : 'Saída'}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-bold text-(--ink)">{movement.productName}</td>
                  <td className="px-5 py-3 text-(--muted)">{movement.userName}</td>
                  <td className="px-5 py-3 font-bold text-(--ink)">{movement.quantity}</td>
                  <td className="px-5 py-3 text-(--muted) text-[11px]">{movement.context ?? '-'}</td>
                  <td className="px-5 py-3 text-(--muted) text-[11px]">
                    {new Date(movement.createdAt).toLocaleDateString('pt-BR', {
                      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {data && data.meta.lastPage > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-(--muted)">Página {data.meta.page} de {data.meta.lastPage} ({data.meta.total} movimentações)</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
              className="flex items-center gap-1 rounded-lg border-2 border-(--stroke) px-3 py-1.5 text-xs font-bold text-(--ink) transition-colors hover:bg-(--soft) disabled:opacity-40"
            ><ChevronLeft size={14} /> Anterior</button>
            <button onClick={() => setPage((p) => p + 1)} disabled={page >= data.meta.lastPage}
              className="flex items-center gap-1 rounded-lg border-2 border-(--stroke) px-3 py-1.5 text-xs font-bold text-(--ink) transition-colors hover:bg-(--soft) disabled:opacity-40"
            >Próximo <ChevronRight size={14} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
