import { apiRequest } from './client';
import type { StockHistoryItem } from '../types';

type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};

export async function getStockMovements(token: string, signal?: AbortSignal, period?: string): Promise<StockHistoryItem[]> {
  const params = new URLSearchParams();
  if (period) params.set('period', period);
  const qs = params.toString();
  const path = `/stock-movements${qs ? `?${qs}` : ''}`;
  const response = await apiRequest<PaginatedResponse<StockHistoryItem>>(path, { accessToken: token, signal });
  return response.data;
}
