import { apiRequest } from './client';
import type { DashboardSummary } from '@/lib/types';

export async function getDashboard(accessToken: string): Promise<DashboardSummary> {
  return apiRequest<DashboardSummary>('/dashboard', {
    method: 'GET',
    accessToken,
  });
}

export type TimelinePoint = { date: string; balance: number };

export async function getDashboardTimeline(accessToken: string): Promise<{ points: TimelinePoint[] }> {
  return apiRequest<{ points: TimelinePoint[] }>('/dashboard/timeline', {
    method: 'GET',
    accessToken,
  });
}