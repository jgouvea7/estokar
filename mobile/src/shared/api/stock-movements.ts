import { apiRequest } from './client';
import type { StockMovement } from '@/src/shared/types/domain';

export async function getStockMovements(accessToken: string): Promise<StockMovement[]> {
  return apiRequest<StockMovement[]>('/stock-movements', {
    accessToken,
    method: 'GET',
  });
}
