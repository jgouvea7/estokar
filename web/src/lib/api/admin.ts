import { apiRequest } from './client';
import type { AdminStats, AdminUser, PaginatedResponse } from '@/lib/types';

export async function getAdminUsers(params: {
  page?: number;
  perPage?: number;
  search?: string;
  accessToken: string;
  signal?: AbortSignal;
}): Promise<PaginatedResponse<AdminUser>> {
  const query = new URLSearchParams({
    page: String(params.page ?? 1),
    perPage: String(params.perPage ?? 10),
  });

  if (params.search) {
    query.set('search', params.search);
  }

  return apiRequest<PaginatedResponse<AdminUser>>(`/admin/users?${query.toString()}`, {
    method: 'GET',
    accessToken: params.accessToken,
    signal: params.signal,
  });
}

export async function promoteUser(userId: string, accessToken: string): Promise<AdminUser> {
  return apiRequest<AdminUser>(`/admin/users/${userId}/promote`, {
    method: 'POST',
    accessToken,
  });
}

export async function deleteUser(userId: string, accessToken: string): Promise<void> {
  await apiRequest<void>(`/admin/users/${userId}`, {
    method: 'DELETE',
    accessToken,
  });
}

export async function getAdminStats(accessToken: string, signal?: AbortSignal): Promise<AdminStats> {
  return apiRequest<AdminStats>('/admin/stats', {
    method: 'GET',
    accessToken,
    signal,
  });
}
