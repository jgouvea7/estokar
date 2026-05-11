"use client";

import { useQuery } from '@tanstack/react-query';
import { DashboardOverview } from '@/components/dashboard/dashboard-overview';
import { getDashboard } from '@/lib/api/dashboard';
import { buildDashboardOverviewData } from '@/lib/dashboard/dashboard-data';
import { useAuthStore } from '@/store/auth-store';

export default function DashboardPage() {
  const isDev = process.env.NODE_ENV === 'development';
  const session = useAuthStore((state) => state.session);

  const dashboardQuery = useQuery({
    queryKey: ['dashboard', session?.user.id],
    queryFn: async () => buildDashboardOverviewData({
      dashboard: await getDashboard(session!.accessToken),
    }),
    enabled: Boolean(session?.accessToken),
    staleTime: 0,
    refetchOnWindowFocus: !isDev,
    retry: false,
  });

  if (!session) {
    return null;
  }

  if (dashboardQuery.isLoading) {
    return <DashboardLoadingState />;
  }

  if (dashboardQuery.isError || !dashboardQuery.data) {
    return (
      <div className="surface-card p-8 text-center">
        <p className="text-lg font-bold text-[#0f172a]">Não foi possível carregar o dashboard</p>
        <p className="mt-2 text-sm text-slate-500">Tente atualizar a página em instantes.</p>
      </div>
    );
  }

  return (
    <DashboardOverview data={dashboardQuery.data} />
  );
}

function DashboardLoadingState() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="surface-card h-56 rounded-4xl bg-linear-to-br from-slate-100 to-slate-200" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="surface-card h-24 rounded-3xl bg-slate-100" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.35fr_0.95fr]">
        <div className="space-y-6">
          <div className="surface-card h-96 rounded-3xl bg-slate-100" />
          <div className="surface-card h-80 rounded-3xl bg-slate-100" />
        </div>
        <div className="space-y-6">
          <div className="surface-card h-80 rounded-3xl bg-slate-100" />
          <div className="surface-card h-80 rounded-3xl bg-slate-100" />
        </div>
      </div>
    </div>
  );
}
