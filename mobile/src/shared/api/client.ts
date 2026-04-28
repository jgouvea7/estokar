import Constants from 'expo-constants';

type RequestOptions = RequestInit & {
  accessToken?: string;
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
  });

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

  return response.json() as Promise<T>;
}