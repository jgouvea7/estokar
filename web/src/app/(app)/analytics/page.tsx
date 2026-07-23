"use client";

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAnalytics } from '@/lib/api/analytics';
import { useAuthStore } from '@/store/auth-store';
import type { AnalyticsPeriod } from '@/lib/types';
import { AnalyticsPeriodToggle } from '@/components/analytics/analytics-period-toggle';
import { AnalyticsSummaryCards } from '@/components/analytics/analytics-summary-cards';
import { AnalyticsTimelineChart } from '@/components/analytics/analytics-timeline-chart';
import { AnalyticsDailyBalanceChart } from '@/components/analytics/analytics-daily-balance-chart';
import { AnalyticsTopSellingChart } from '@/components/analytics/analytics-top-selling-chart';
import { AnalyticsLowestSellingChart } from '@/components/analytics/analytics-lowest-selling-chart';
import { AnalyticsCategoryPerformanceChart } from '@/components/analytics/analytics-category-performance-chart';
import { AnalyticsWeekdayChart } from '@/components/analytics/analytics-weekday-chart';
import { AnalyticsStockRangesChart } from '@/components/analytics/analytics-stock-ranges-chart';
import { AnalyticsForecastTable } from '@/components/analytics/analytics-forecast-table';

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('monthly');
  const session = useAuthStore((state) => state.session);

  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics', session?.user.id, period],
    queryFn: async () => getAnalytics(session!.accessToken, period),
    enabled: Boolean(session?.accessToken),
    staleTime: 30_000,
  });

  if (!session) return null;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-(--soft)" />
          <div className="h-8 w-48 animate-pulse rounded-lg bg-(--soft)" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-(--soft)" />
          ))}
        </div>
        <div className="h-72 animate-pulse rounded-xl bg-(--soft)" />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-72 animate-pulse rounded-xl bg-(--soft)" />
          <div className="h-72 animate-pulse rounded-xl bg-(--soft)" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-72 animate-pulse rounded-xl bg-(--soft)" />
          <div className="h-72 animate-pulse rounded-xl bg-(--soft)" />
        </div>
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
    <div className="space-y-6">
      <section className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-(--muted)">
            Estatísticas detalhadas do seu estoque.
          </p>
        </div>
        <AnalyticsPeriodToggle period={period} onChange={setPeriod} />
      </section>

      <AnalyticsSummaryCards summary={data.summary} />

      <AnalyticsTimelineChart data={data.timeline} />

      <section className="grid gap-6 lg:grid-cols-2">
        <AnalyticsDailyBalanceChart data={data.dailyBalance} />
        <AnalyticsWeekdayChart data={data.weekDayDistribution} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <AnalyticsTopSellingChart data={data.topSelling} />
        <AnalyticsLowestSellingChart data={data.lowestSelling} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <AnalyticsCategoryPerformanceChart data={data.categoryPerformance} />
        <AnalyticsStockRangesChart data={data.stockRanges} />
      </section>

      <AnalyticsForecastTable data={data.forecast} />
    </div>
  );
}
