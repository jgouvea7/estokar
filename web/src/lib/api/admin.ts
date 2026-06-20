import { apiRequest } from './client';
import type {
  AdminStats,
  AdminStatsPeriod,
  AdminUser,
  PaginatedResponse,
  AdminUserDetail,
  AdminLogEntry,
  AdminDashboardData,
  AdminProductItem,
  AdminMovementItem,
  AdminHealthData,
} from '@/lib/types';

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

export async function getAdminUserDetail(
  userId: string,
  accessToken: string,
): Promise<AdminUserDetail> {
  return apiRequest<AdminUserDetail>(`/admin/users/${userId}`, {
    method: 'GET',
    accessToken,
  });
}

export async function promoteUser(userId: string, accessToken: string): Promise<AdminUser> {
  return apiRequest<AdminUser>(`/admin/users/${userId}/promote`, {
    method: 'PATCH',
    accessToken,
  });
}

export async function deleteUser(userId: string, accessToken: string): Promise<void> {
  await apiRequest<void>(`/admin/users/${userId}`, {
    method: 'DELETE',
    accessToken,
  });
}

export async function getAdminStats(params: {
  accessToken: string;
  period?: AdminStatsPeriod;
  signal?: AbortSignal;
}): Promise<AdminStats> {
  const query = new URLSearchParams();
  if (params.period) query.set('period', params.period);
  const path = query.toString() ? `/admin/stats?${query.toString()}` : '/admin/stats';
  return apiRequest<AdminStats>(path, {
    method: 'GET',
    accessToken: params.accessToken,
    signal: params.signal,
  });
}

export async function getAdminDashboard(accessToken: string): Promise<AdminDashboardData> {
  return apiRequest<AdminDashboardData>('/admin/dashboard', {
    method: 'GET',
    accessToken,
  });
}

export async function getAdminLogs(params: {
  page?: number;
  perPage?: number;
  accessToken: string;
}): Promise<PaginatedResponse<AdminLogEntry>> {
  const query = new URLSearchParams({
    page: String(params.page ?? 1),
    perPage: String(params.perPage ?? 10),
  });
  return apiRequest<PaginatedResponse<AdminLogEntry>>(`/admin/logs?${query.toString()}`, {
    method: 'GET',
    accessToken: params.accessToken,
  });
}

export async function getAdminProducts(params: {
  page?: number;
  perPage?: number;
  search?: string;
  accessToken: string;
}): Promise<PaginatedResponse<AdminProductItem>> {
  const query = new URLSearchParams({
    page: String(params.page ?? 1),
    perPage: String(params.perPage ?? 20),
  });
  if (params.search) query.set('search', params.search);
  return apiRequest<PaginatedResponse<AdminProductItem>>(`/admin/products?${query.toString()}`, {
    method: 'GET',
    accessToken: params.accessToken,
  });
}

export async function getAdminMovements(params: {
  page?: number;
  perPage?: number;
  accessToken: string;
}): Promise<PaginatedResponse<AdminMovementItem>> {
  const query = new URLSearchParams({
    page: String(params.page ?? 1),
    perPage: String(params.perPage ?? 20),
  });
  return apiRequest<PaginatedResponse<AdminMovementItem>>(`/admin/movements?${query.toString()}`, {
    method: 'GET',
    accessToken: params.accessToken,
  });
}

export async function getAdminHealth(accessToken: string): Promise<AdminHealthData> {
  return apiRequest<AdminHealthData>('/admin/health', {
    method: 'GET',
    accessToken,
  });
}
