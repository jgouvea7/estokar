import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthSession } from '@/lib/types';

type AuthState = {
  session: AuthSession | null;
  setSession: (session: AuthSession) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      setSession: (session) => set({ session }),
      clearSession: () => set({ session: null }),
    }),
    {
      name: 'estokar-web-auth',
    },
  ),
);
