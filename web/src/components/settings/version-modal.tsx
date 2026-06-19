"use client";

import { X, Rocket, Bug, Zap } from 'lucide-react';
import { useEffect } from 'react';

interface VersionChange {
  type: 'feature' | 'fix' | 'improvement';
  text: string;
}

interface VersionEntry {
  version: string;
  date: string;
  changes: VersionChange[];
}

const changelog: VersionEntry[] = [
  {
    version: 'v1.11.0',
    date: '18 de Junho, 2026',
    changes: [
      {
        type: 'improvement',
        text: 'Implementada exportação de produtos, movimentações de estoque e relatórios em formato CSV.',
      },
    ],
  },
];

interface VersionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VersionModal({ isOpen, onClose }: VersionModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-2 sm:p-6">
      <div
        className="absolute inset-0 bg-[rgba(26,26,46,0.45)]"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl overflow-hidden rounded-xl border-2 border-(--stroke) bg-(--card) reveal-up">
        <div className="flex items-center justify-between border-b-2 border-(--stroke) px-8 py-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-(--accent)">Histórico de Sistema</p>
            <h3 className="text-2xl font-bold text-(--ink)">Notas de Atualização</h3>
          </div>
          <button
            onClick={onClose}
            className="group flex h-12 w-12 items-center justify-center rounded-lg border-2 border-(--stroke) bg-(--card) text-(--muted) transition-all hover:bg-(--soft)"
          >
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-8 py-6">
          <div className="space-y-12">
            {changelog.map((entry, index) => (
              <div key={entry.version} className="relative pl-8">
                {index !== changelog.length - 1 && (
                  <div className="absolute left-[11px] top-8 h-full w-0.5 bg-(--stroke)" />
                )}

                <div className="absolute left-0 top-1.5 h-6 w-6 rounded-full border-4 border-(--card) bg-(--accent)" />

                <header className="mb-6">
                  <div className="flex items-center gap-3">
                    <h4 className="text-xl font-bold text-(--ink)">{entry.version}</h4>
                    <span className="rounded-lg bg-(--accent-soft) px-3 py-1 text-[10px] font-bold text-(--accent) uppercase tracking-wider">
                      {entry.date}
                    </span>
                  </div>
                </header>

                <ul className="space-y-4">
                  {entry.changes.map((change, i) => (
                    <li key={i} className="flex gap-4">
                      <div className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${change.type === 'feature' ? 'bg-(--ok-soft) text-(--ok)' :
                        change.type === 'fix' ? 'bg-(--critical-soft) text-(--critical)' :
                          'bg-(--accent-soft) text-(--accent)'
                        }`}>
                        {change.type === 'feature' ? <Rocket size={14} /> :
                          change.type === 'fix' ? <Bug size={14} /> :
                            <Zap size={14} />}
                      </div>
                      <p className="text-sm font-medium leading-relaxed text-(--muted)">
                        {change.text}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t-2 border-(--stroke) bg-(--soft) px-8 py-6">
          <button
            onClick={onClose}
            className="w-full rounded-lg bg-(--ink) py-4 text-sm font-bold text-white transition-all hover:brightness-125"
          >
            Entendi, obrigado!
          </button>
        </div>
      </div>
    </div>
  );
}
