import { apiRequest } from './client';
import type { DashboardSummary } from '@/src/shared/types/domain';

export async function getDashboard(accessToken: string): Promise<DashboardSummary> {
  return apiRequest<DashboardSummary>('/dashboard', {
    accessToken,
    method: 'GET',
  });
}
