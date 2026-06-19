import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthSession } from '@/lib/types';

type AuthState = {
  session: AuthSession | null;
  setSession: (session: AuthSession) => void;
  clearSession: () => void;
};

function clearLocalStorageTokens() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem('accessToken');
  window.localStorage.removeItem('refreshToken');
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      setSession: (session) => set({ session }),
      clearSession: () => {
        clearLocalStorageTokens();
        set({ session: null });
      },
    }),
    {
      name: 'estokar-web-auth',
    },
  ),
);
