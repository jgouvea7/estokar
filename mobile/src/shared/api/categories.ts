import { apiRequest } from './client';
import type { Category } from '@/src/shared/types/domain';

export async function getCategories(accessToken: string): Promise<Category[]> {
  return apiRequest<Category[]>('/categories', {
    accessToken,
    method: 'GET',
  });
}

export async function createCategory(accessToken: string, name: string): Promise<Category> {
  return apiRequest<Category>('/categories', {
    accessToken,
    body: JSON.stringify({ name }),
    method: 'POST',
  });
}

export async function updateCategory(
  accessToken: string,
  categoryId: string,
  name: string,
): Promise<Category> {
  return apiRequest<Category>(`/categories/${categoryId}`, {
    accessToken,
    body: JSON.stringify({ name }),
    method: 'PUT',
  });
}

export async function deleteCategory(accessToken: string, categoryId: string): Promise<void> {
  await apiRequest(`/categories/${categoryId}`, {
    accessToken,
    method: 'DELETE',
  });
}
