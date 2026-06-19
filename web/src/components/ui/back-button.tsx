'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

export function BackButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      className="flex items-center gap-1.5 rounded-lg border-2 border-(--stroke) bg-(--card) px-3.5 py-2 text-xs font-bold text-(--ink) transition-colors hover:bg-(--soft)"
    >
      <ChevronLeft size={14} />
      Voltar
    </button>
  );
}
