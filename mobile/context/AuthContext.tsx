import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { loginUser, logoutUser, registerUser, fetchProfile } from '@/services/auth.service';
import { parseApiError } from '@/src/shared/api/client';
import type { User } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await loginUser({ email, password });
      setAccessToken(response.accessToken);
      setRefreshToken(response.refreshToken);
      setUser(response.user);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      setIsLoading(true);
      setError(null);
      try {
        await registerUser({ name, email, password });
        // Após cadastro, faz login automaticamente
        const response = await loginUser({ email, password });
        setAccessToken(response.accessToken);
        setRefreshToken(response.refreshToken);
        setUser(response.user);
      } catch (err) {
        setError(parseApiError(err));
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      if (accessToken) {
        await logoutUser(accessToken).catch(() => {
          // Ignora erro de rede no logout — limpa o estado local de qualquer forma
        });
      }
    } finally {
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
      setError(null);
      setIsLoading(false);
    }
  }, [accessToken]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      refreshToken,
      isLoading,
      error,
      login,
      register,
      logout,
      clearError,
    }),
    [user, accessToken, refreshToken, isLoading, error, login, register, logout, clearError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  }
  return context;
}
