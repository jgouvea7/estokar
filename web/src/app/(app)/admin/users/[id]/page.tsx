'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth-store';
import { getAdminUserDetail } from '@/lib/api/admin';
import { ArrowUpRight, ArrowDownLeft, Package2, Layers3, ArrowUpDown, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const accessToken = useAuthStore((state) => state.session?.accessToken);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-user-detail', id],
    queryFn: () => getAdminUserDetail(id, accessToken!),
    enabled: Boolean(accessToken) && Boolean(id),
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="surface-card h-32 rounded-xl bg-(--soft)" />
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="surface-card h-20 rounded-xl bg-(--soft)" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const stats = [
    { icon: Package2, label: 'Produtos', value: data.productCount },
    { icon: Layers3, label: 'Categorias', value: data.categoryCount },
    { icon: ArrowUpDown, label: 'Movimentações', value: data.movementCount },
    { icon: AlertTriangle, label: 'Estoque Total', value: data.totalStock },
  ];

  return (
    <div className="space-y-8">
      <header className="surface-card rounded-xl border-2 border-(--stroke) p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black text-(--ink)">{data.name}</h1>
            <p className="text-sm text-(--muted) mt-1">{data.email}</p>
            <div className="flex items-center gap-3 mt-3">
              <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${data.role === 'ADMIN' ? 'bg-(--accent-soft) text-(--accent)' : 'bg-(--soft) text-(--muted)'}`}>
                {data.role}
              </span>
              <span className="text-[11px] text-(--muted)">
                Cadastro: {new Date(data.createdAt).toLocaleDateString('pt-BR')}
              </span>
              <span className="text-[11px] text-(--muted)">
                Alertas: {data.alertDaysBefore} dias
              </span>
            </div>
          </div>
          <Link href="/admin/users" className="text-xs font-bold text-(--accent) hover:underline">
            ← Voltar
          </Link>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="surface-card flex items-center gap-3 p-4 rounded-xl border-2 border-(--stroke)">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-(--accent-soft) text-(--accent)">
              <stat.icon size={18} strokeWidth={2.3} />
            </div>
            <div>
              <p className="text-lg font-bold leading-none text-(--ink)">{stat.value}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-(--muted)">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {data.recentMovements.length > 0 && (
        <div className="surface-card rounded-xl border-2 border-(--stroke) p-6">
          <h2 className="text-sm font-bold text-(--ink) mb-4">Últimas Movimentações</h2>
          <div className="space-y-2">
            {data.recentMovements.map((movement) => (
              <div key={movement.id} className="flex items-center justify-between rounded-lg border border-(--stroke) px-4 py-2.5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${movement.type === 'in' ? 'bg-(--ok-soft) text-(--ok)' : 'bg-(--critical-soft) text-(--critical)'}`}>
                    {movement.type === 'in' ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-(--ink) truncate">{movement.productName}</p>
                    <p className="text-[10px] text-(--muted) font-medium">
                      {movement.type === 'in' ? 'Entrada' : 'Saída'} • {movement.quantity} unidades
                      {movement.context ? ` • ${movement.context}` : ''}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] text-(--muted) shrink-0">
                  {new Date(movement.createdAt).toLocaleDateString('pt-BR')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
