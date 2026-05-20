import { apiRequest } from './client';
import type {
  CreateProductPayload,
  Product,
  ProductDashboardResponse,
  ProductDetailsResponse,
  UpdateProductPayload,
} from '@/src/shared/types/domain';

export async function getProduct(id: string, accessToken: string): Promise<Product> {
  return apiRequest<Product>(`/products/${id}`, {
    accessToken,
    method: 'GET',
  });
}

export async function getProducts(accessToken: string): Promise<Product[]> {
  return apiRequest<Product[]>('/products', {
    accessToken,
    method: 'GET',
  });
}

export async function createProduct(
  accessToken: string,
  payload: CreateProductPayload,
): Promise<Product> {
  return apiRequest<Product>('/products', {
    accessToken,
    body: JSON.stringify(payload),
    method: 'POST',
  });
}

export async function updateProduct(
  accessToken: string,
  productId: string,
  payload: UpdateProductPayload,
): Promise<Product> {
  return apiRequest<Product>(`/products/${productId}`, {
    accessToken,
    body: JSON.stringify(payload),
    method: 'PATCH',
  });
}

export async function deleteProduct(accessToken: string, productId: string): Promise<void> {
  await apiRequest(`/products/${productId}`, {
    accessToken,
    method: 'DELETE',
  });
}

export async function getProductDashboard(
  id: string,
  accessToken: string,
): Promise<ProductDashboardResponse> {
  return apiRequest<ProductDashboardResponse>(`/products/${id}/dashboard`, {
    accessToken,
    method: 'GET',
  });
}

export async function getProductDetails(
  id: string,
  accessToken: string,
): Promise<ProductDetailsResponse> {
  return apiRequest<ProductDetailsResponse>(`/products/${id}/details`, {
    accessToken,
    method: 'GET',
  });
}
