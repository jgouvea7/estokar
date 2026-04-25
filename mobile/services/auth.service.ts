import { apiRequest } from '@/src/shared/api/client';
import type { LoginResponse, User } from '@/types';

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

/** POST /auth/register */
export async function registerUser(payload: RegisterPayload): Promise<User> {
  return apiRequest<User>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/** POST /auth/login → retorna tokens + dados do usuário */
export async function loginUser(payload: LoginPayload): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/** POST /auth/logout (requer JWT) */
export async function logoutUser(token: string): Promise<void> {
  return apiRequest<void>('/auth/logout', {
    method: 'POST',
    accessToken: token,
  });
}

/** GET /auth/me (requer JWT) */
export async function fetchProfile(token: string): Promise<User> {
  return apiRequest<User>('/auth/me', { accessToken: token });
}
