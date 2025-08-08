import { create } from "zustand";
import { persist } from "zustand/middleware";

interface OnboardingState {
  hasSeenOnboarding: boolean;
  hasSeenTutorial: boolean;
  setHasSeenOnboarding: (seen: boolean) => void;
  setHasSeenTutorial: (seen: boolean) => void;
  resetOnboarding: () => void;
}

export const useOnboarding = create<OnboardingState>()(
  persist(
    (set) => ({
      hasSeenOnboarding: false,
      hasSeenTutorial: false,
      
      setHasSeenOnboarding: (seen) => {
        set({ hasSeenOnboarding: seen });
      },
      
      setHasSeenTutorial: (seen) => {
        set({ hasSeenTutorial: seen });
      },
      
      resetOnboarding: () => {
        set({ hasSeenOnboarding: false, hasSeenTutorial: false });
      }
    }),
    {
      name: 'puppet-runner-onboarding'
    }
  )
);