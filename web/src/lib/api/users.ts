import { apiRequest } from './client';
import type { UserProfile } from '@/lib/types';

export async function deleteMyAccount(accessToken: string): Promise<void> {
  await apiRequest<void>('/users/me', {
    method: 'DELETE',
    accessToken,
  });
}

export async function updateUser(
  userId: string,
  payload: Partial<Pick<UserProfile, 'alertDaysBefore' | 'email' | 'name'>>,
  accessToken: string,
): Promise<UserProfile> {
  return apiRequest<UserProfile>(`/users/${userId}`, {
    method: 'PATCH',
    accessToken,
    body: JSON.stringify(payload),
  });
}
