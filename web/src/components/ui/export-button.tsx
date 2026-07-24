'use client';

import { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown } from 'lucide-react';

type ExportButtonProps = {
  onExportCsv: () => void;
  label?: string;
};

export function ExportButton({ onExportCsv, label = 'Exportar' }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border-2 border-(--stroke) bg-(--card) px-4 text-xs font-bold text-(--ink) transition-all hover:bg-(--soft)"
      >
        <Download size={14} strokeWidth={2.5} />
        {label}
        <ChevronDown size={12} strokeWidth={2.5} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-1 w-36 rounded-lg border-2 border-(--stroke) bg-(--card) py-1 shadow-lg">
            <button
              type="button"
              onClick={() => { onExportCsv(); setIsOpen(false); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs font-bold text-(--ink) transition-colors hover:bg-(--soft)"
            >
              <Download size={14} />
              CSV
            </button>
          </div>
        </>
      )}
    </div>
  );
}
