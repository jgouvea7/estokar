"use client";

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAnalytics } from '@/lib/api/analytics';
import { useAuthStore } from '@/store/auth-store';
import type { AnalyticsFilter, AnalyticsPeriod } from '@/lib/types';
import { AnalyticsFilterToggle } from '@/components/analytics/analytics-filter-toggle';
import { AnalyticsTimelineChart } from '@/components/analytics/analytics-timeline-chart';
import { AnalyticsDailyBalanceChart } from '@/components/analytics/analytics-daily-balance-chart';
import { AnalyticsTopSellingChart } from '@/components/analytics/analytics-top-selling-chart';
import { AnalyticsLowestSellingChart } from '@/components/analytics/analytics-lowest-selling-chart';
import { AnalyticsCategoryPerformanceChart } from '@/components/analytics/analytics-category-performance-chart';
import { AnalyticsForecastTable } from '@/components/analytics/analytics-forecast-table';
import { AnalyticsTopStockChart } from '@/components/analytics/analytics-top-stock-chart';
import { AnalyticsSummaryCards } from '@/components/analytics/analytics-summary-cards';

function aggregateByPeriod<T extends { date: string }>(
  data: T[] | undefined,
  filter: AnalyticsFilter,
): T[] {
  if (!data || !data.length) return [];
  if (!filter || filter === 'daily') return data;

  const groups = new Map<string, T & { entries: number; outputs: number }>();
  for (const item of data) {
    const rawDate = (item as { date: string }).date;
    if (!rawDate) continue;
    const d = new Date(rawDate + 'T00:00:00');
    if (isNaN(d.getTime())) continue;
    const key = (() => {
      switch (filter) {
        case 'weekly': {
          const start = new Date(d);
          start.setDate(d.getDate() - d.getDay());
          return start.toISOString().slice(0, 10);
        }
        case 'monthly':
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        case 'yearly':
          return `${d.getFullYear()}`;
        default:
          return rawDate;
      }
    })();
    const existing = groups.get(key);
    const entry = item as T & { entries: number; outputs: number };
    if (existing) {
      existing.entries += entry.entries;
      existing.outputs += entry.outputs;
    } else {
      groups.set(key, { ...entry, date: key });
    }
  }
  return Array.from(groups.values()) as unknown as T[];
}

export default function AnalyticsPage() {
  const [filter, setFilter] = useState<AnalyticsFilter>(null);
  const session = useAuthStore((state) => state.session);

  const period = filter ?? 'monthly';
  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics', session?.user.id, period],
    queryFn: async () => getAnalytics(session!.accessToken, period as AnalyticsPeriod),
    enabled: Boolean(session?.accessToken),
    staleTime: 30_000,
  });

  const aggregatedDailyBalance = useMemo(
    () => (data ? aggregateByPeriod(data.dailyBalance, filter) : []),
    [data, filter],
  );

  const filteredTimeline = useMemo(() => {
    if (!data || !data.timeline.length) return [];
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    if (filter === 'daily') startDate.setDate(startDate.getDate() - 1);
    else if (filter === 'weekly') startDate.setDate(startDate.getDate() - 7);
    else if (filter === 'monthly') startDate.setMonth(startDate.getMonth() - 1);
    else if (filter === 'yearly') startDate.setFullYear(startDate.getFullYear() - 1);
    else return data.timeline;
    const cutoff = startDate.toISOString().slice(0, 10);
    return data.timeline.filter((p) => p.date >= cutoff);
  }, [data, filter]);

  if (!session) return null;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-(--soft)" />
          <div className="h-8 w-48 animate-pulse rounded-lg bg-(--soft)" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="surface-card h-[4.5rem] animate-pulse rounded-xl bg-(--soft)" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-56 animate-pulse rounded-xl bg-(--soft)" />
          <div className="h-56 animate-pulse rounded-xl bg-(--soft)" />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-48 animate-pulse rounded-xl bg-(--soft)" />
          <div className="h-48 animate-pulse rounded-xl bg-(--soft)" />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-48 animate-pulse rounded-xl bg-(--soft)" />
          <div className="h-48 animate-pulse rounded-xl bg-(--soft)" />
        </div>
        <div className="h-80 animate-pulse rounded-xl bg-(--soft)" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm font-medium text-(--critical)">
          Erro ao carregar analytics. Tente novamente.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-(--muted)">
            Estatísticas detalhadas do seu estoque.
          </p>
        </div>
        <AnalyticsFilterToggle selected={filter} onChange={setFilter} />
      </section>

      <AnalyticsSummaryCards summary={data.summary} />

      <section className="grid gap-4 lg:grid-cols-2">
        <AnalyticsTimelineChart data={filteredTimeline} filter={filter} />
        <AnalyticsDailyBalanceChart data={aggregatedDailyBalance} filter={filter} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <AnalyticsTopSellingChart data={data.topSelling} filter={filter} />
        <AnalyticsLowestSellingChart data={data.lowestSelling} filter={filter} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <AnalyticsTopStockChart data={data.stockDistribution} />
        <AnalyticsCategoryPerformanceChart data={data.categoryPerformance} />
      </section>

      <AnalyticsForecastTable data={data.forecast} />
    </div>
  );
}