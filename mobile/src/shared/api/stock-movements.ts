import { apiRequest } from './client';
import type { StockMovement } from '@/src/shared/types/domain';

type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};

export async function getStockMovements(accessToken: string): Promise<StockMovement[]> {
  const response = await apiRequest<PaginatedResponse<StockMovement>>('/stock-movements', {
    accessToken,
    method: 'GET',
  });
  return response.data;
}
