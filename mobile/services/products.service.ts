import { apiRequest } from '@/src/shared/api/client';
import type { Product, CreateProductPayload, UpdateProductPayload } from '@/types';

export async function fetchProducts(): Promise<Product[]> {
  return apiRequest<Product[]>('/products');
}

export async function fetchProduct(id: string): Promise<Product> {
  return apiRequest<Product>(`/products/${id}`);
}

export async function createProduct(
  payload: CreateProductPayload,
  token: string,
): Promise<Product> {
  return apiRequest<Product>('/products', {
    method: 'POST',
    body: JSON.stringify(payload),
    accessToken: token,
  });
}

export async function updateProduct(
  id: string,
  payload: UpdateProductPayload,
  token: string,
): Promise<Product> {
  return apiRequest<Product>(`/products/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
    accessToken: token,
  });
}

export async function deleteProduct(id: string, token: string): Promise<void> {
  return apiRequest<void>(`/products/${id}`, {
    method: 'DELETE',
    accessToken: token,
  });
}
