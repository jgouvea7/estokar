import { apiRequest, buildApiUrl } from './client';
import type { AuthResponse, AuthSession, UserProfile } from '@/lib/types';

type LoginPayload = {
  email: string;
  password: string;
};

type RegisterPayload = LoginPayload & {
  name: string;
};

export async function login(payload: LoginPayload): Promise<AuthSession> {
  const response = await apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return {
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    user: response.user,
  };
}

export async function register(payload: RegisterPayload): Promise<void> {
  await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getProfile(accessToken: string): Promise<UserProfile> {
  return apiRequest<UserProfile>('/auth/me', {
    method: 'GET',
    accessToken,
  });
}

type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
};

export async function refreshTokens(refreshToken: string): Promise<RefreshResponse> {
  return apiRequest<RefreshResponse>('/auth/refresh', {
    method: 'POST',
    accessToken: refreshToken,
    skipRefresh: true,
  });
}

export function getGoogleOAuthUrl(redirectUri: string): string {
  const authUrl = buildApiUrl('/auth/google');
  const url = new URL(authUrl);
  url.searchParams.set('redirect_uri', redirectUri);
  return url.toString();
}

export function handleGoogleLogin(setGoogleLoading: (loading: boolean) => void) {
  setGoogleLoading(true);
  const redirectUri = `${window.location.origin}/auth/callback`;
  window.location.href = getGoogleOAuthUrl(redirectUri);
}
