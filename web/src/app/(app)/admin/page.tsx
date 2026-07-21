'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth-store';
import { getAdminDashboard } from '@/lib/api/admin';
import { Users, Package2, Layers3, ArrowUpDown, AlertTriangle, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const accessToken = useAuthStore((state) => state.session?.accessToken);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => getAdminDashboard(accessToken!),
    enabled: Boolean(accessToken),
    refetchInterval: 30_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="surface-card h-24 rounded-3xl bg-(--soft)" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const cards = [
    { icon: Users, label: 'Usuários', value: data.totalUsers, sub: `+${data.usersThisMonth} este mês`, href: '/admin/users' },
    { icon: Package2, label: 'Produtos', value: data.totalProducts, sub: `+${data.productsThisMonth} este mês`, href: '/admin/products' },
    { icon: Layers3, label: 'Categorias', value: data.totalCategories, sub: 'em todo o sistema', href: '#' },
    { icon: ArrowUpDown, label: 'Movimentações', value: data.totalMovements, sub: `+${data.movementsThisMonth} este mês`, href: '/admin/movements' },
    { icon: AlertTriangle, label: 'Estoque Crítico', value: data.lowStockProducts, sub: 'produtos com ≤5 unidades', href: '/admin/products' },
  ];

  return (
    <div className="space-y-8 reveal-up">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <p className="text-sm font-medium text-(--muted)">Visão geral do sistema.</p>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map((card) => (
          <Link key={card.label} href={card.href} className="surface-card flex items-center gap-3 p-4 transition-colors hover:bg-(--soft)">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-(--accent-soft) text-(--accent)">
              <card.icon size={18} strokeWidth={2.3} />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold leading-none text-(--ink)">{card.value}</p>
              <p className="mt-1 truncate text-[10px] font-bold uppercase tracking-widest text-(--muted)">{card.label}</p>
              <p className="text-[10px] text-(--accent) font-medium">{card.sub}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="surface-card rounded-xl border-2 border-(--stroke) p-6">
          <h2 className="flex items-center gap-2 text-sm font-bold text-(--ink) mb-4">
            <Users size={16} /> Últimos Usuários Cadastrados
          </h2>
          <div className="space-y-3">
            {data.recentUsers.map((user) => (
              <Link key={user.id} href={`/admin/users/${user.id}`} className="flex items-center justify-between rounded-lg border border-(--stroke) px-4 py-2.5 transition-colors hover:bg-(--soft)">
                <div>
                  <p className="text-sm font-bold text-(--ink)">{user.name}</p>
                  <p className="text-[11px] text-(--muted)">{user.email}</p>
                </div>
                <span className="text-[10px] font-bold uppercase text-(--muted)">{user.role}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="surface-card rounded-xl border-2 border-(--stroke) p-6">
          <h2 className="flex items-center gap-2 text-sm font-bold text-(--ink) mb-4">
            <TrendingUp size={16} /> Top Usuários por Produtos
          </h2>
          <div className="space-y-3">
            {data.topUsersByProducts.map((item, i) => (
              <div key={item.userId} className="flex items-center justify-between rounded-lg border border-(--stroke) px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-(--soft) text-[10px] font-bold text-(--muted)">{i + 1}</span>
                  <p className="text-sm font-bold text-(--ink)">{item.userName}</p>
                </div>
                <span className="text-xs font-bold text-(--accent)">{item.count} produtos</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
