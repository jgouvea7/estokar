import { apiRequest } from './client';
import type { UserProfile } from '@/src/shared/types/domain';

export async function deleteMyAccount(accessToken: string): Promise<void> {
  await apiRequest<void>('/users/me', {
    accessToken,
    method: 'DELETE',
  });
}

export async function updateUser(
  userId: string,
  payload: Partial<Pick<UserProfile, 'alertDaysBefore' | 'email' | 'name'>>,
  accessToken: string,
  signal?: AbortSignal,
): Promise<UserProfile> {
  return apiRequest<UserProfile>(`/users/${userId}`, {
    accessToken,
    body: JSON.stringify(payload),
    method: 'PATCH',
    signal,
  });
}
