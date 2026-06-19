"use client";

import { Package, Users } from 'lucide-react';
import type { AdminStats } from '@/lib/types';

interface StatsCardsProps {
  stats: AdminStats | null;
  isLoading: boolean;
}

export function StatsCards({ stats, isLoading }: StatsCardsProps) {
  const items = [
    {
      label: 'Total de Usuários',
      value: stats?.totalUsers ?? 0,
      icon: Users,
    },
    {
      label: 'Total de Produtos',
      value: stats?.totalProducts ?? 0,
      icon: Package,
    },
  ];

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {items.map((item, index) => {
        const Icon = item.icon;

        if (isLoading) {
          return (
            <div key={index} className="h-28 animate-pulse rounded-xl bg-(--soft)" />
          );
        }

        return (
          <div key={index} className="flex items-center justify-between rounded-xl border-2 border-(--stroke) bg-(--card) p-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-(--muted)">{item.label}</p>
              <h3 className="mt-2 text-2xl font-bold text-(--ink)">{item.value}</h3>
              <p className="mt-2 text-[10px] font-medium text-(--muted)">Dados em tempo real</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-(--soft) text-(--ink)">
              <Icon size={20} strokeWidth={2} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
