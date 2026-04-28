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
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
};

export async function login(payload: LoginPayload): Promise<AuthSession> {
  const response = await apiRequest<AuthResponse>('/auth/login', {
    body: JSON.stringify(payload),
    method: 'POST',
  });

  const raw = (response as any).data ?? response;

  const accessToken = raw?.accessToken || raw?.access_token;
  const refreshToken = raw?.refreshToken || raw?.refresh_token;
  const user = raw?.user;

  if (!accessToken) {
    throw new Error('Login não retornou accessToken');
  }

  return {
    accessToken,
    refreshToken,
    user,
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

