import { apiRequest, buildApiUrl } from './client';
import type { AuthSession, UserProfile } from '@/src/shared/types/domain';

type LoginPayload = {
  email: string;
  password: string;
};

type RegisterPayload = LoginPayload & {
  name: string;
};

type AuthResponse = {
  access_token: string;
  refresh_token: string;
  user: UserProfile;
};

export async function login(payload: LoginPayload): Promise<AuthSession> {
  const response = await apiRequest<AuthResponse>('/auth/login', {
    body: JSON.stringify(payload),
    method: 'POST',
  });

  return {
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
    user: response.user,
  };
}

export async function register(payload: RegisterPayload): Promise<void> {
  await apiRequest('/auth/register', {
    body: JSON.stringify(payload),
    method: 'POST',
  });
}

export async function getProfile(accessToken: string): Promise<UserProfile> {
  return apiRequest<UserProfile>('/auth/me', {
    accessToken,
    method: 'GET',
  });
}

export function getGoogleOAuthUrl(redirectUri: string): string {
  const authUrl = buildApiUrl('/auth/google');
  const url = new URL(authUrl);
  url.searchParams.set('redirect_uri', redirectUri);
  return url.toString();
}

