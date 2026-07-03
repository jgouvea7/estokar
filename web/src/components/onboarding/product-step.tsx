"use client";

import { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { createProduct } from '@/lib/api/products';
import { captureEvent } from '@/lib/analytics';
import { Package2, ArrowRight } from 'lucide-react';

export function ProductStep({
  onNext,
  onComplete,
  isSubmitting,
  setIsSubmitting,
}: {
  onNext: () => void;
  onComplete: () => void;
  isSubmitting: boolean;
  setIsSubmitting: (v: boolean) => void;
}) {
  const session = useAuthStore((state) => state.session);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('10');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.accessToken || !name.trim()) return;

    setIsSubmitting(true);

    try {
      await createProduct(
        { name: name.trim(), description: '', quantity: Number(quantity) || 1, image: '' },
        session.accessToken,
      );
      captureEvent('onboarding_step_2_product_created', { productName: name });
      onComplete();
    } catch {
      onNext();
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSkip() {
    captureEvent('onboarding_step_2_skipped');
    onNext();
  }

  return (
    <div className="text-center reveal-up">
      <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-(--accent-soft) text-(--accent)">
        <Package2 size={28} strokeWidth={2} />
      </div>

      <h2 className="text-2xl font-bold tracking-tight text-(--ink) sm:text-3xl">
        Adicione seu primeiro produto
      </h2>
      <p className="mt-2 text-sm text-(--muted) max-w-sm mx-auto">
        Cadastre o item que você mais vende — o dashboard vai se preencher automaticamente.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5 text-left">
        <div>
          <label className="mb-1.5 block text-xs font-bold text-(--ink)">Nome do produto</label>
          <input
            required
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Arroz 5kg, Óleo de soja..."
            className="w-full rounded-lg border-2 border-(--stroke) bg-(--card) px-4 py-3 text-sm font-medium text-(--ink) outline-none transition-colors placeholder:text-(--muted) focus:border-(--accent)"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold text-(--ink)">Quantidade em estoque</label>
          <input
            required
            type="number"
            min={0}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full rounded-lg border-2 border-(--stroke) bg-(--card) px-4 py-3 text-sm font-medium text-(--ink) outline-none transition-colors placeholder:text-(--muted) focus:border-(--accent)"
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-(--button) px-5 py-3 text-sm font-bold text-white transition-all hover:brightness-125 disabled:opacity-40"
          >
            {isSubmitting ? 'Cadastrando...' : 'Adicionar e continuar'}
            <ArrowRight size={16} />
          </button>
          <button
            type="button"
            onClick={handleSkip}
            className="rounded-lg border-2 border-(--stroke) px-4 py-3 text-sm font-semibold text-(--muted) transition-colors hover:bg-(--soft)"
          >
            Pular etapa
          </button>
        </div>
      </form>
    </div>
  );
}
