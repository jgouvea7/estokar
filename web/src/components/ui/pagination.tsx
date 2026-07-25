'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 pt-4">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="inline-flex h-8 items-center gap-1 rounded-lg border-2 border-(--stroke) bg-(--card) px-3 text-xs font-bold text-(--ink) transition-all hover:bg-(--soft) disabled:opacity-40"
      >
        <ChevronLeft size={14} />
        Anterior
      </button>
      <span className="text-xs font-bold text-(--muted)">{currentPage} / {totalPages}</span>
      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="inline-flex h-8 items-center gap-1 rounded-lg border-2 border-(--stroke) bg-(--card) px-3 text-xs font-bold text-(--ink) transition-all hover:bg-(--soft) disabled:opacity-40"
      >
        Próximo
        <ChevronRight size={14} />
      </button>
    </div>
  );
}
