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
    version: 'v1.7.1',
    date: '10 de Maio, 2026',
    changes: [
      {
        type: 'fix',
        text: 'Correção de Camadas: Resolvido bug onde o modal de configurações era renderizado atrás da navegação lateral.'
      },
      {
        type: 'improvement',
        text: 'Refinamento Mobile: Redução da largura da Sidebar para melhor aproveitamento de espaço em dispositivos móveis.'
      }
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-6">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl overflow-hidden rounded-[2.5rem] border border-white/20 bg-white/90 shadow-[0_40px_100px_-20px_rgba(15,23,42,0.4)] backdrop-blur-xl reveal-up">
        <div className="flex items-center justify-between border-b border-slate-100 px-8 py-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">Histórico de Sistema</p>
            <h3 className="text-2xl font-black text-[#0f172a]">Notas de Atualização</h3>
          </div>
          <button
            onClick={onClose}
            className="group flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-100 bg-white text-slate-400 transition-all hover:border-slate-200 hover:text-slate-900 hover:shadow-lg"
          >
            <X size={20} className="transition-transform group-hover:rotate-90" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-8 py-6 custom-scrollbar">
          <div className="space-y-12">
            {changelog.map((entry, index) => (
              <div key={entry.version} className="relative pl-8">
                {index !== changelog.length - 1 && (
                  <div className="absolute left-[11px] top-8 h-full w-0.5 bg-gradient-to-b from-blue-100 to-transparent" />
                )}

                <div className="absolute left-0 top-1.5 h-6 w-6 rounded-full border-4 border-white bg-blue-500 shadow-md shadow-blue-200" />

                <header className="mb-6">
                  <div className="flex items-center gap-3">
                    <h4 className="text-xl font-bold text-[#0f172a]">{entry.version}</h4>
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                      {entry.date}
                    </span>
                  </div>
                </header>

                <ul className="space-y-4">
                  {entry.changes.map((change, i) => (
                    <li key={i} className="flex gap-4">
                      <div className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${change.type === 'feature' ? 'bg-emerald-50 text-emerald-600' :
                        change.type === 'fix' ? 'bg-rose-50 text-rose-600' :
                          'bg-blue-50 text-blue-600'
                        }`}>
                        {change.type === 'feature' ? <Rocket size={14} /> :
                          change.type === 'fix' ? <Bug size={14} /> :
                            <Zap size={14} />}
                      </div>
                      <p className="text-sm font-medium leading-relaxed text-slate-600">
                        {change.text}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-100 bg-slate-50/50 px-8 py-6">
          <button
            onClick={onClose}
            style={{ background: 'var(--brand-gradient)' }}
            className="w-full rounded-2xl py-4 text-sm font-bold text-white transition-all shadow-[0_20px_50px_-20px_rgba(15,23,42,0.5)] ring-1 ring-white/10 hover:-translate-y-0.5 active:scale-95"
          >
            Entendi, obrigado!
          </button>
        </div>
      </div>
    </div>
  );
}
