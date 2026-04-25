import { apiRequest } from './client';
import type { CreateProductPayload, Product, UpdateProductPayload } from '@/lib/types';

export async function getProducts(accessToken: string): Promise<Product[]> {
  return apiRequest<Product[]>('/products', {
    method: 'GET',
    accessToken,
  });
}

export async function createProduct(
  payload: CreateProductPayload,
  accessToken: string,
): Promise<Product> {
  return apiRequest<Product>('/products', {
    method: 'POST',
    accessToken,
    body: JSON.stringify(payload),
  });
}

export async function updateProduct(
  id: string,
  payload: UpdateProductPayload,
  accessToken: string,
): Promise<Product> {
  return apiRequest<Product>(`/products/${id}`, {
    method: 'PATCH',
    accessToken,
    body: JSON.stringify(payload),
  });
}

export async function deleteProduct(id: string, accessToken: string): Promise<void> {
  await apiRequest<void>(`/products/${id}`, {
    method: 'DELETE',
    accessToken,
  });
}
