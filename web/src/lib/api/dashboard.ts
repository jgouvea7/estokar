import { apiRequest } from './client';
import type { DashboardSummary } from '@/lib/types';

export async function getDashboard(accessToken: string): Promise<DashboardSummary> {
  return apiRequest<DashboardSummary>('/dashboard', {
    method: 'GET',
    accessToken,
  });
}