"use client";

import { Users, ShieldCheck, User as UserIcon, TrendingUp } from 'lucide-react';
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
      color: 'blue',
      gradient: 'from-blue-500 to-indigo-600',
    },
    {
      label: 'Administradores',
      value: stats?.totalAdmins ?? 0,
      icon: ShieldCheck,
      color: 'indigo',
      gradient: 'from-indigo-500 to-purple-600',
    },
    {
      label: 'Usuários FREE',
      value: stats?.totalFree ?? 0,
      icon: UserIcon,
      color: 'slate',
      gradient: 'from-slate-500 to-slate-700',
    },
  ];

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, index) => {
        const Icon = item.icon;
        
        if (isLoading) {
          return (
            <div key={index} className="h-32 animate-pulse rounded-3xl bg-slate-100" />
          );
        }

        return (
          <div 
            key={index} 
            className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50"
          >
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{item.label}</p>
                <h3 className="mt-2 text-3xl font-black text-slate-900">{item.value}</h3>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${item.gradient} text-white shadow-lg`}>
                <Icon size={24} strokeWidth={2.5} />
              </div>
            </div>
            
            <div className="mt-4 flex items-center gap-1.5">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <TrendingUp size={12} strokeWidth={3} />
              </div>
              <p className="text-xs font-bold text-emerald-600">Atualizado agora</p>
            </div>

            {/* Decorative background shape */}
            <div className={`absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-slate-50 opacity-0 transition-all group-hover:scale-150 group-hover:opacity-100`} />
          </div>
        );
      })}
    </div>
  );
}
