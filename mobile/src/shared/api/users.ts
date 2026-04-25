import { apiRequest } from './client';

export async function deleteMyAccount(accessToken: string): Promise<void> {
  await apiRequest<void>('/users/me', {
    accessToken,
    method: 'DELETE',
  });
}
