type RequestOptions = RequestInit & {
  accessToken?: string;
};

const API_PREFIX = '/api';
const API_URL = process.env.NEXT_PUBLIC_API_URL;

function getApiBaseUrl() {
  if (!API_URL) {
    return API_PREFIX;
  }

  const baseUrl = API_URL.replace(/\/$/, '');

  if (baseUrl.startsWith('/')) {
    return baseUrl.endsWith(API_PREFIX) ? baseUrl : `${baseUrl}${API_PREFIX}`;
  }

  return baseUrl.endsWith(API_PREFIX) ? baseUrl : `${baseUrl}${API_PREFIX}`;
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

  if (!response.ok) {
    let message = 'Nao foi possivel completar a requisicao.';

    try {
      const body = await response.json();
      message = Array.isArray(body.message) ? body.message.join('\n') : body.message ?? message;
    } catch {

    }

    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
