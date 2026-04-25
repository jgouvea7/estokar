import Constants from 'expo-constants';
import { Platform } from 'react-native';

type RequestOptions = RequestInit & {
  accessToken?: string;
};

function getDefaultApiUrl() {
  const expoHostUri =
    Constants.expoConfig?.hostUri ??
    ((Constants as unknown as { expoGoConfig?: { debuggerHost?: string } }).expoGoConfig
      ?.debuggerHost ??
      (Constants as unknown as { manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } } })
        .manifest2?.extra?.expoGo?.debuggerHost);

  if (typeof expoHostUri === 'string' && expoHostUri.length > 0) {
    const [host] = expoHostUri.split(':');
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:3000`;
    }
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }

  return 'http://localhost:3000';
}

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  getDefaultApiUrl();

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
      message = Array.isArray(body.message) ? body.message.join('\n') : body.message ?? message;
    } catch {
      // Keep default message when the server does not return JSON.
    }

    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
