import { apiRequest } from './client';
import type { AnalyticsData, AnalyticsPeriod } from '@/lib/types';

export async function getAnalytics(
  accessToken: string,
  period: AnalyticsPeriod | null,
): Promise<AnalyticsData> {
  const qs = period ? `?period=${period}` : '';
  return apiRequest<AnalyticsData>(`/analytics${qs}`, {
    method: 'GET',
    accessToken,
  });
}
