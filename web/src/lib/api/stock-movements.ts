import { apiRequest } from './client';
import type { StockHistoryItem } from '../types';

type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};

export async function getStockMovements(token: string, signal?: AbortSignal): Promise<StockHistoryItem[]> {
  const response = await apiRequest<PaginatedResponse<StockHistoryItem>>('/stock-movements', { accessToken: token, signal });
  return response.data;
}
