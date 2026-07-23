import { apiRequest } from './client';
import type { AnalyticsData, AnalyticsPeriod } from '@/lib/types';

export async function getAnalytics(
  accessToken: string,
  period: AnalyticsPeriod,
): Promise<AnalyticsData> {
  return apiRequest<AnalyticsData>(`/analytics?period=${period}`, {
    method: 'GET',
    accessToken,
  });
}
