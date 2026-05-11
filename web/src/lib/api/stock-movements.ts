import { apiRequest } from './client';
import type { StockHistoryItem } from '../types';

export async function getStockMovements(token: string, signal?: AbortSignal): Promise<StockHistoryItem[]> {
  return apiRequest<StockHistoryItem[]>('/stock-movements', { accessToken: token, signal });
}
