import { create } from 'zustand';
import type { StockHistoryItem } from '@/lib/types';

type HistoryState = {
  items: StockHistoryItem[];
  addHistoryItem: (item: Omit<StockHistoryItem, 'id' | 'createdAt'>) => void;
  setItems: (items: StockHistoryItem[]) => void;
  clearHistory: () => void;
};

export const useHistoryStore = create<HistoryState>()((set) => ({
  items: [],
  addHistoryItem: (item) =>
    set((state) => ({
      items: [
        {
          ...item,
          id: `history-${Date.now()}-${Math.round(Math.random() * 1000)}`,
          createdAt: new Date().toISOString(),
        },
        ...state.items,
      ].slice(0, 120),
    })),
  setItems: (items) => set({ items }),
  clearHistory: () => set({ items: [] }),
}));
