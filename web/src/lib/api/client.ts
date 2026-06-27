type RequestOptions = RequestInit & {
  accessToken?: string;
  skipRefresh?: boolean;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function getApiBaseUrl() {
  if (!API_URL) {
    return "";
  }

  return API_URL.replace(/\/$/, '');
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

  if (response.status === 401 && options.accessToken && !options.skipRefresh) {
    const refreshed = await tryRefreshTokens();

    if (refreshed) {
      return apiRequest<T>(path, {
        ...options,
        accessToken: refreshed,
        skipRefresh: true,
      });
    } else {
      if (typeof window !== 'undefined') {
        const { useAuthStore } = await import('@/store/auth-store');
        useAuthStore.getState().clearSession();
        window.location.href = '/';
      }
    }
  }

  if (!response.ok) {
    let message = 'Nao foi possivel completar a requisicao.';

    try {
      const body = await response.json();
      const detail = Array.isArray(body.message) ? body.message.join('\n') : body.message;
      if (detail && typeof detail === 'string') {
        message = detail;
      }
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
  if (typeof window === 'undefined') {
    return null;
  }

  const refreshToken = window.localStorage.getItem('refreshToken');

  if (!refreshToken) {
    return null;
  }

  const response = await fetch(buildApiUrl('/auth/refresh'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${refreshToken}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    return null;
  }

  const payload = await response.json() as { accessToken: string; refreshToken: string };

  if (!payload?.accessToken || !payload?.refreshToken) {
    return null;
  }

  window.localStorage.setItem('accessToken', payload.accessToken);
  window.localStorage.setItem('refreshToken', payload.refreshToken);

  const { useAuthStore } = await import('@/store/auth-store');
  const currentSession = useAuthStore.getState().session;

  if (currentSession?.user) {
    useAuthStore.getState().setSession({
      ...currentSession,
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
    });
  }

  return payload.accessToken;
}
