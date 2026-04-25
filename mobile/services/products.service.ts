import { apiRequest } from '@/src/shared/api/client';
import type { Product, CreateProductPayload, UpdateProductPayload } from '@/types';

/** GET /products — público */
export async function fetchProducts(): Promise<Product[]> {
  return apiRequest<Product[]>('/products');
}

/** GET /products/:id — público */
export async function fetchProduct(id: string): Promise<Product> {
  return apiRequest<Product>(`/products/${id}`);
}

/** POST /products — requer JWT */
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

/** PATCH /products/:id — requer JWT */
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

/** DELETE /products/:id — requer JWT */
export async function deleteProduct(id: string, token: string): Promise<void> {
  return apiRequest<void>(`/products/${id}`, {
    method: 'DELETE',
    accessToken: token,
  });
}
