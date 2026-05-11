import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  isDesktopCollapsed: boolean;
  toggleDesktopCollapsed: () => void;
  setDesktopCollapsed: (value: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isDesktopCollapsed: false,
      toggleDesktopCollapsed: () => set((state) => ({ isDesktopCollapsed: !state.isDesktopCollapsed })),
      setDesktopCollapsed: (value) => set({ isDesktopCollapsed: value }),
    }),
    {
      name: 'estokar-ui-storage',
    }
  )
);
