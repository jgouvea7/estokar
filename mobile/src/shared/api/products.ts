import { apiRequest } from './client';
import type {
  CreateProductInput,
  RemoteProduct,
  UpdateProductInput,
} from '@/src/shared/types/domain';

export async function getProducts(accessToken: string): Promise<RemoteProduct[]> {
  return apiRequest<RemoteProduct[]>('/products', {
    accessToken,
    method: 'GET',
  });
}

export async function createProduct(
  accessToken: string,
  payload: CreateProductInput,
): Promise<RemoteProduct> {
  const { category: _category, lowStockLimit: _lowStockLimit, categoryId, ...rest } = payload;
  
  const backendPayload = {
    ...rest,
    ...(categoryId ? { categoryId } : {}),
  };

  return apiRequest<RemoteProduct>('/products', {
    accessToken,
    body: JSON.stringify(backendPayload),
    method: 'POST',
  });
}

export async function updateProduct(
  accessToken: string,
  productId: string,
  payload: UpdateProductInput,
): Promise<RemoteProduct> {
  const { category: _category, lowStockLimit: _lowStockLimit, categoryId, ...rest } = payload;
  
  const backendPayload = {
    ...rest,
    ...(categoryId ? { categoryId } : {}),
  };

  return apiRequest<RemoteProduct>(`/products/${productId}`, {
    accessToken,
    body: JSON.stringify(backendPayload),
    method: 'PATCH',
  });
}

export async function deleteProduct(accessToken: string, productId: string): Promise<void> {
  await apiRequest(`/products/${productId}`, {
    accessToken,
    method: 'DELETE',
  });
}
