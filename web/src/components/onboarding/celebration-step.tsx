"use client";

import { useEffect, useState } from 'react';
import { ArrowRight, BarChart3, Sparkles } from 'lucide-react';

export function CelebrationStep({ onComplete }: { onComplete: () => void }) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="text-center reveal-up">
      <div className={`mx-auto mb-6 transition-all duration-700 ${showContent ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-(--accent-soft) mx-auto">
          <Sparkles size={32} className="text-(--accent)" />
        </div>
      </div>

      <h2 className={`text-2xl font-bold tracking-tight text-(--ink) sm:text-3xl transition-all duration-500 delay-300 ${showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
        Tudo pronto!
      </h2>
      <p className={`mt-3 text-sm text-(--muted) max-w-sm mx-auto transition-all duration-500 delay-500 ${showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
        Seu estoque já está configurado. O dashboard vai mostraralertas de reposição, previsão de dias restantes e muito mais.
      </p>

      <div className={`mt-8 grid grid-cols-2 gap-3 transition-all duration-500 delay-700 ${showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
        <div className="rounded-xl border-2 border-(--stroke) bg-(--card) p-4 text-left">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-(--ok-soft) text-(--ok)">
            <BarChart3 size={18} />
          </div>
          <p className="mt-3 text-sm font-bold text-(--ink)">Dashboard em tempo real</p>
          <p className="mt-1 text-xs text-(--muted)">Métricas e alertas atualizados automaticamente.</p>
        </div>
        <div className="rounded-xl border-2 border-(--stroke) bg-(--card) p-4 text-left">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-(--ok-soft) text-(--ok)">
            <Sparkles size={18} />
          </div>
          <p className="mt-3 text-sm font-bold text-(--ink)">Previsão inteligente</p>
          <p className="mt-1 text-xs text-(--muted)">Saiba quando cada produto vai acabar.</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onComplete}
        className={`mt-8 inline-flex items-center gap-2 rounded-lg bg-(--button) px-6 py-3 text-sm font-bold text-white transition-all hover:brightness-125 transition-all duration-500 delay-900 ${showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
      >
        Ir para o Dashboard
        <ArrowRight size={16} />
      </button>
    </div>
  );
}
