import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ThemeMode = 'system' | 'light' | 'dark';

interface UIState {
  isDesktopCollapsed: boolean;
  toggleDesktopCollapsed: () => void;
  setDesktopCollapsed: (value: boolean) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isDesktopCollapsed: false,
      toggleDesktopCollapsed: () => set((state) => ({ isDesktopCollapsed: !state.isDesktopCollapsed })),
      setDesktopCollapsed: (value) => set({ isDesktopCollapsed: value }),
      theme: 'system',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'estokar-ui-storage',
    }
  )
);
