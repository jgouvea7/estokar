"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboardingStore } from '@/store/onboarding-store';
import { BrandIcon } from '@/components/ui/brand-icon';
import { WelcomeStep } from '@/components/onboarding/welcome-step';
import { ProductStep } from '@/components/onboarding/product-step';
import { CelebrationStep } from '@/components/onboarding/celebration-step';
import { captureEvent } from '@/lib/analytics';

const STEPS = [
  { title: 'Sobre sua loja', description: 'Conte como trabalha' },
  { title: 'Primeiro produto', description: 'Adicione seu estoque inicial' },
  { title: 'Pronto!', description: 'Comece a usar' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const currentStep = useOnboardingStore((state) => state.currentStep);
  const setCurrentStep = useOnboardingStore((state) => state.setCurrentStep);
  const completeOnboarding = useOnboardingStore((state) => state.completeOnboarding);
  const skipOnboarding = useOnboardingStore((state) => state.skipOnboarding);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleNext() {
    setCurrentStep(currentStep + 1);
  }

  function handleComplete() {
    captureEvent('onboarding_completed', { step: currentStep });
    completeOnboarding();
    router.replace('/dashboard');
  }

  function handleSkip() {
    captureEvent('onboarding_skipped', { step: currentStep });
    skipOnboarding();
    router.replace('/dashboard');
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="mb-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-(--brand-bg) text-(--accent)">
            <BrandIcon size={20} />
          </div>
          <div>
            <h1 className="text-base font-bold text-(--ink) leading-tight">Estokar</h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-(--muted)">Inventory OS</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSkip}
          className="rounded-lg border-2 border-(--stroke) px-4 py-2 text-xs font-bold text-(--muted) transition-colors hover:text-(--ink) hover:bg-(--soft)"
        >
          Pular onboarding
        </button>
      </header>

      <div className="mb-12">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            return (
              <div key={step.title} className="flex flex-1 items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all ${
                      isCompleted
                        ? 'bg-(--ok) text-white'
                        : isActive
                          ? 'bg-(--accent) text-white ring-4 ring-(--accent-soft)'
                          : 'bg-(--stroke) text-(--muted)'
                    }`}
                  >
                    {isCompleted ? '✓' : index + 1}
                  </div>
                  <p className={`mt-2 text-[10px] font-bold uppercase tracking-wider ${
                    isActive ? 'text-(--accent)' : 'text-(--muted)'
                  }`}>
                    {step.title}
                  </p>
                  <p className="text-[9px] text-(--muted)">{step.description}</p>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`mx-3 mt-[-28px] h-0.5 flex-1 rounded-full ${
                    index < currentStep ? 'bg-(--ok)' : 'bg-(--stroke)'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-lg">
          {currentStep === 0 && (
            <WelcomeStep onNext={handleNext} />
          )}
          {currentStep === 1 && (
            <ProductStep
              onNext={handleNext}
              onComplete={handleComplete}
              isSubmitting={isSubmitting}
              setIsSubmitting={setIsSubmitting}
            />
          )}
          {currentStep === 2 && (
            <CelebrationStep
              onComplete={handleComplete}
            />
          )}
        </div>
      </div>
    </div>
  );
}
