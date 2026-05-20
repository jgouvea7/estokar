import Constants from 'expo-constants';
import { clearSession, getSession, saveSession } from '@/src/shared/storage/local-db';

type RequestOptions = RequestInit & {
  accessToken?: string;
  skipRefresh?: boolean;
};

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  'https://estokar-backend-c5bxevc3gycsefbu.eastus-01.azurewebsites.net';

const API_PREFIX = '/api';

function getApiBaseUrl() {
  const baseUrl = API_URL.replace(/\/$/, '');

  if (baseUrl.endsWith(API_PREFIX)) {
    return baseUrl;
  }

  return `${baseUrl}${API_PREFIX}`;
}

export function buildApiUrl(path: string) {
  return `${getApiBaseUrl()}${path}`;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function parseApiError(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Erro inesperado. Tente novamente.';
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  if (options.accessToken) {
    headers.set('Authorization', `Bearer ${options.accessToken}`);
  }

  const response = await fetch(buildApiUrl(path), {
    ...options,
    headers,
    cache: 'no-store',
  });

  if (response.status === 401 && options.accessToken && !options.skipRefresh) {
    const refreshedToken = await tryRefreshTokens();

    if (refreshedToken) {
      return apiRequest<T>(path, {
        ...options,
        accessToken: refreshedToken,
        skipRefresh: true,
      });
    }
  }

  if (!response.ok) {
    let message = 'Nao foi possivel completar a requisicao.';

    try {
      const body = await response.json();
      message = Array.isArray(body.message)
        ? body.message.join('\n')
        : body.message ?? message;
    } catch {
    }

    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();

  if (!text) {
    return undefined as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as T;
  }
}

async function tryRefreshTokens(): Promise<string | null> {
  const session = await getSession();

  if (!session?.refreshToken) {
    return null;
  }

  const response = await fetch(buildApiUrl('/auth/refresh'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.refreshToken}`,
    },
  });

  if (!response.ok) {
    await clearSession();
    return null;
  }

  const payload = (await response.json()) as { accessToken?: string; refreshToken?: string };

  if (!payload?.accessToken || !payload?.refreshToken) {
    await clearSession();
    return null;
  }

  await saveSession({
    ...session,
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
  });

  return payload.accessToken;
}