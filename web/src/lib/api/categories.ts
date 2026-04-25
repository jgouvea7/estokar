import { apiRequest } from './client';
import type { Category } from '@/lib/types';

export async function getCategories(accessToken: string): Promise<Category[]> {
  return apiRequest<Category[]>('/categories', {
    method: 'GET',
    accessToken,
  });
}

export async function createCategory(accessToken: string, name: string): Promise<Category> {
  return apiRequest<Category>('/categories', {
    method: 'POST',
    accessToken,
    body: JSON.stringify({ name }),
  });
}

export async function updateCategory(
  accessToken: string,
  categoryId: string,
  name: string,
): Promise<Category> {
  return apiRequest<Category>(`/categories/${categoryId}`, {
    method: 'PUT',
    accessToken,
    body: JSON.stringify({ name }),
  });
}

export async function deleteCategory(accessToken: string, categoryId: string): Promise<void> {
  await apiRequest<void>(`/categories/${categoryId}`, {
    method: 'DELETE',
    accessToken,
  });
}
