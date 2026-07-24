import { apiRequest } from './client';
import type { DashboardSummary } from '@/lib/types';

export async function getDashboard(accessToken: string): Promise<DashboardSummary> {
  return apiRequest<DashboardSummary>('/dashboard', {
    method: 'GET',
    accessToken,
  });
}

export type TimelinePoint = { date: string; balance: number };

export async function getDashboardTimeline(accessToken: string, period?: string): Promise<{ points: TimelinePoint[] }> {
  const params = new URLSearchParams();
  if (period) params.set('period', period);
  const qs = params.toString();
  const path = `/dashboard/timeline${qs ? `?${qs}` : ''}`;
  return apiRequest<{ points: TimelinePoint[] }>(path, {
    method: 'GET',
    accessToken,
  });
}

export type CategoryStockPoint = {
  categoryName: string;
  stock: number;
  percentage: number;
};

export async function getCategoryStockDistribution(accessToken: string): Promise<{ points: CategoryStockPoint[] }> {
  return apiRequest<{ points: CategoryStockPoint[] }>('/dashboard/categories-stock', {
    method: 'GET',
    accessToken,
  });
}