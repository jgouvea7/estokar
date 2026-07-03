"use client";

import { useState } from 'react';
import { useOnboardingStore } from '@/store/onboarding-store';
import { captureEvent } from '@/lib/analytics';
import { Store, Coffee, Shirt, Wrench, Car, Package, ArrowRight } from 'lucide-react';

const BUSINESS_TYPES = [
  { id: 'alimentacao', icon: Coffee, label: 'Alimentação', desc: 'Mercado, padaria, restaurante' },
  { id: 'vestuario', icon: Shirt, label: 'Vestuário', desc: 'Roupas, calçados, acessórios' },
  { id: 'pecas', icon: Wrench, label: 'Oficina / Peças', desc: 'Auto peças, manutenção' },
  { id: 'varejo', icon: Store, label: 'Varejo geral', desc: 'Loja física, minimercado' },
  { id: 'automotivo', icon: Car, label: 'Automotivo', desc: 'Concessionária, estética' },
  { id: 'outro', icon: Package, label: 'Outro', desc: 'Outro tipo de negócio' },
];

export function WelcomeStep({ onNext }: { onNext: () => void }) {
  const businessType = useOnboardingStore((state) => state.businessType);
  const setBusinessType = useOnboardingStore((state) => state.setBusinessType);
  const [selected, setSelected] = useState(businessType);

  function handleSelect(id: string) {
    setSelected(id);
  }

  function handleContinue() {
    if (!selected) return;
    setBusinessType(selected);
    captureEvent('onboarding_step_1', { businessType: selected });
    onNext();
  }

  return (
    <div className="text-center reveal-up">
      <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-(--accent-soft) text-(--accent)">
        <Store size={28} strokeWidth={2} />
      </div>

      <h2 className="text-2xl font-bold tracking-tight text-(--ink) sm:text-3xl">
        O que você vende?
      </h2>
      <p className="mt-2 text-sm text-(--muted) max-w-sm mx-auto">
        Isso nos ajuda a personalizar sugestões e alertas para o seu tipo de negócio.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-3">
        {BUSINESS_TYPES.map(({ id, icon: Icon, label, desc }) => {
          const isActive = selected === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => handleSelect(id)}
              className={`flex flex-col items-center gap-2 rounded-xl border-2 p-5 text-center transition-all ${
                isActive
                  ? 'border-(--accent) bg-(--accent-soft)'
                  : 'border-(--stroke) bg-(--card) hover:border-(--accent-soft) hover:bg-(--soft)'
              }`}
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                isActive ? 'bg-(--card) text-(--accent)' : 'bg-(--soft) text-(--muted)'
              }`}>
                <Icon size={20} />
              </div>
              <div>
                <p className={`text-sm font-bold ${isActive ? 'text-(--accent)' : 'text-(--ink)'}`}>{label}</p>
                <p className="text-[10px] font-medium text-(--muted)">{desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        disabled={!selected}
        onClick={handleContinue}
        className="mt-8 inline-flex items-center gap-2 rounded-lg bg-(--button) px-6 py-3 text-sm font-bold text-white transition-all hover:brightness-125 disabled:opacity-40"
      >
        Continuar
        <ArrowRight size={16} />
      </button>
    </div>
  );
}
