import { apiRequest } from './client';
import type {
  CreateProductPayload,
  Product,
  ProductDetailsResponse,
  ProductDashboardResponse,
  UpdateProductPayload,
} from '@/lib/types';

export async function getProduct(id: string, accessToken: string): Promise<Product> {
  return apiRequest<Product>(`/products/${id}`, {
    method: 'GET',
    accessToken,
  });
}

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

export async function getProductDashboard(id: string, accessToken: string): Promise<ProductDashboardResponse> {
  return apiRequest<ProductDashboardResponse>(`/products/${id}/dashboard`, {
    method: 'GET',
    accessToken,
  });
}

export async function getProductDetails(id: string, accessToken: string): Promise<ProductDetailsResponse> {
  return apiRequest<ProductDetailsResponse>(`/products/${id}/details`, {
    method: 'GET',
    accessToken,
  });
}
