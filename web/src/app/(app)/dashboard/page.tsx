"use client";

import dynamic from 'next/dynamic';
import { useQueries } from '@tanstack/react-query';
import { getDashboard, getDashboardTimeline } from '@/lib/api/dashboard';

const DashboardOverview = dynamic(
  () => import('@/components/dashboard/dashboard-overview').then((m) => m.DashboardOverview),
  { loading: DashboardLoadingState },
);
import { buildDashboardOverviewData } from '@/lib/dashboard/dashboard-data';
import { useAuthStore } from '@/store/auth-store';

export default function DashboardPage() {
  const isDev = process.env.NODE_ENV === 'development';
  const session = useAuthStore((state) => state.session);

  const results = useQueries({
    queries: [
      {
        queryKey: ['dashboard', session?.user.id],
        queryFn: async () => getDashboard(session!.accessToken),
        enabled: Boolean(session?.accessToken),
        staleTime: 30_000,
        refetchOnWindowFocus: !isDev,
        retry: false,
      },
      {
        queryKey: ['dashboard-timeline', session?.user.id],
        queryFn: async () => getDashboardTimeline(session!.accessToken),
        enabled: Boolean(session?.accessToken),
        staleTime: 30_000,
        refetchOnWindowFocus: !isDev,
        retry: false,
      },
    ],
  });

  const dashboardQuery = results[0];
  const timelineQuery = results[1];

  const data = (() => {
    if (!dashboardQuery.data || !timelineQuery.data) return null;
    return buildDashboardOverviewData({
      dashboard: dashboardQuery.data,
      timeline: timelineQuery.data.points,
    });
  })();

  if (!session) {
    return null;
  }

  if (results.some((r) => r.isLoading)) {
    return <DashboardLoadingState />;
  }

  if (!data) {
    return (
      <div className="surface-card p-8 text-center">
        <p className="text-lg font-bold text-(--ink)">Não foi possível carregar o dashboard</p>
        <p className="mt-2 text-sm text-(--muted)">Tente atualizar a página em instantes.</p>
      </div>
    );
  }

  return (
    <DashboardOverview data={data} accessToken={session.accessToken} />
  );
}

function DashboardLoadingState() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="surface-card h-56 rounded-4xl bg-linear-to-br from-(--soft) to-(--surface-2)" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="surface-card h-24 rounded-3xl bg-(--soft)" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.35fr_0.95fr]">
        <div className="space-y-6">
          <div className="surface-card h-96 rounded-3xl bg-(--soft)" />
          <div className="surface-card h-80 rounded-3xl bg-(--soft)" />
        </div>
        <div className="space-y-6">
          <div className="surface-card h-80 rounded-3xl bg-(--soft)" />
          <div className="surface-card h-80 rounded-3xl bg-(--soft)" />
        </div>
      </div>
    </div>
  );
}
