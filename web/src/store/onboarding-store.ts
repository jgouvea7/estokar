import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type OnboardingState = {
  hasCompletedOnboarding: boolean;
  currentStep: number;
  businessType: string;
  setBusinessType: (type: string) => void;
  setCurrentStep: (step: number) => void;
  completeOnboarding: () => void;
  skipOnboarding: () => void;
  resetOnboarding: () => void;
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasCompletedOnboarding: false,
      currentStep: 0,
      businessType: '',
      setBusinessType: (type) => set({ businessType: type }),
      setCurrentStep: (step) => set({ currentStep: step }),
      completeOnboarding: () => set({ hasCompletedOnboarding: true, currentStep: 3 }),
      skipOnboarding: () => set({ hasCompletedOnboarding: true, currentStep: 0 }),
      resetOnboarding: () => set({ hasCompletedOnboarding: false, currentStep: 0, businessType: '' }),
    }),
    {
      name: 'estokar-onboarding',
    },
  ),
);
