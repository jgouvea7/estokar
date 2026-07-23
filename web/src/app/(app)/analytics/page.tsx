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
import { AnalyticsStockDistributionChart } from '@/components/analytics/analytics-stock-distribution-chart';
import { AnalyticsTopStockChart } from '@/components/analytics/analytics-top-stock-chart';

function aggregateByPeriod<T extends { date: string }>(
  data: T[],
  filter: AnalyticsFilter,
): T[] {
  if (!filter || filter === 'daily') return data;

  const groupKey = (date: string): string => {
    const d = new Date(date + 'T00:00:00');
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
        return date;
    }
  };

  const groups = new Map<string, T & { entries: number; outputs: number }>();
  for (const item of data) {
    const key = groupKey((item as { date: string }).date);
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

  if (!session) return null;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-(--soft)" />
          <div className="h-8 w-48 animate-pulse rounded-lg bg-(--soft)" />
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="h-56 animate-pulse rounded-xl bg-(--soft) lg:col-span-2" />
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

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AnalyticsTimelineChart data={data.timeline} />
        </div>
        <div>
          <AnalyticsDailyBalanceChart data={aggregatedDailyBalance} filter={filter} />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <AnalyticsTopSellingChart data={data.topSelling} filter={filter} />
        <AnalyticsLowestSellingChart data={data.lowestSelling} filter={filter} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <AnalyticsCategoryPerformanceChart data={data.categoryPerformance} />
        <AnalyticsTopStockChart data={data.stockDistribution} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <AnalyticsStockDistributionChart data={data.stockDistribution} />
        <div />
      </section>

      <AnalyticsForecastTable data={data.forecast} />
    </div>
  );
}