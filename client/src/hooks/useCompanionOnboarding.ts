import { useState, useEffect } from 'react';
import { useActiveAccount } from 'thirdweb/react';

export interface OnboardingState {
  hasSeenOnboarding: boolean;
  currentStep: number;
  completedSteps: number[];
  skippedTutorial: boolean;
  onboardingStartTime?: number;
  onboardingCompleteTime?: number;
  hasFollowedTwitter: boolean;
  hasJoinedTelegram: boolean;
}

const ONBOARDING_STORAGE_KEY = 'companion_onboarding_state';

export function useCompanionOnboarding() {
  const account = useActiveAccount();
  const [onboardingState, setOnboardingState] = useState<OnboardingState>({
    hasSeenOnboarding: false,
    currentStep: 0,
    completedSteps: [],
    skippedTutorial: false,
    hasFollowedTwitter: false,
    hasJoinedTelegram: false
  });

  // Load onboarding state from localStorage on mount
  useEffect(() => {
    if (account?.address) {
      const storageKey = `${ONBOARDING_STORAGE_KEY}_${account.address}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsedState = JSON.parse(saved);
          setOnboardingState(parsedState);
        } catch (error) {
          console.error('Error parsing onboarding state:', error);
        }
      }
    }
  }, [account?.address]);

  // Save onboarding state to localStorage
  const saveOnboardingState = (newState: Partial<OnboardingState>) => {
    if (account?.address) {
      const storageKey = `${ONBOARDING_STORAGE_KEY}_${account.address}`;
      const updatedState = { ...onboardingState, ...newState };
      setOnboardingState(updatedState);
      localStorage.setItem(storageKey, JSON.stringify(updatedState));
    }
  };

  const startOnboarding = () => {
    saveOnboardingState({
      hasSeenOnboarding: false,
      currentStep: 0,
      completedSteps: [],
      skippedTutorial: false,
      onboardingStartTime: Date.now()
    });
  };

  const completeOnboarding = () => {
    saveOnboardingState({
      hasSeenOnboarding: true,
      onboardingCompleteTime: Date.now()
    });
  };

  const skipOnboarding = () => {
    saveOnboardingState({
      hasSeenOnboarding: true,
      skippedTutorial: true,
      onboardingCompleteTime: Date.now()
    });
  };

  const updateCurrentStep = (step: number) => {
    saveOnboardingState({
      currentStep: step
    });
  };

  const markStepCompleted = (step: number) => {
    const newCompletedSteps = [...onboardingState.completedSteps];
    if (!newCompletedSteps.includes(step)) {
      newCompletedSteps.push(step);
      saveOnboardingState({
        completedSteps: newCompletedSteps
      });
    }
  };

  const resetOnboarding = () => {
    if (account?.address) {
      const storageKey = `${ONBOARDING_STORAGE_KEY}_${account.address}`;
      localStorage.removeItem(storageKey);
      setOnboardingState({
        hasSeenOnboarding: false,
        currentStep: 0,
        completedSteps: [],
        skippedTutorial: false,
        hasFollowedTwitter: false,
        hasJoinedTelegram: false
      });
    }
  };

  const shouldShowOnboarding = () => {
    // Show onboarding if user hasn't seen it and has a connected wallet
    return account?.address && !onboardingState.hasSeenOnboarding;
  };

  const areSocialTasksCompleted = () => {
    return onboardingState.hasFollowedTwitter && onboardingState.hasJoinedTelegram;
  };

  const markTwitterCompleted = () => {
    saveOnboardingState({
      hasFollowedTwitter: true
    });
  };

  const markTelegramCompleted = () => {
    saveOnboardingState({
      hasJoinedTelegram: true
    });
  };

  const getOnboardingProgress = () => {
    const totalSteps = 4; // Based on the tutorial steps
    const progress = (onboardingState.completedSteps.length / totalSteps) * 100;
    return Math.min(progress, 100);
  };

  const getOnboardingDuration = () => {
    if (onboardingState.onboardingStartTime && onboardingState.onboardingCompleteTime) {
      return onboardingState.onboardingCompleteTime - onboardingState.onboardingStartTime;
    }
    return null;
  };

  return {
    onboardingState,
    startOnboarding,
    completeOnboarding,
    skipOnboarding,
    updateCurrentStep,
    markStepCompleted,
    resetOnboarding,
    shouldShowOnboarding,
    getOnboardingProgress,
    getOnboardingDuration,
    areSocialTasksCompleted,
    markTwitterCompleted,
    markTelegramCompleted,
    
    // Computed properties
    isOnboardingComplete: onboardingState.hasSeenOnboarding,
    wasOnboardingSkipped: onboardingState.skippedTutorial,
    currentStep: onboardingState.currentStep,
    completedSteps: onboardingState.completedSteps,
    hasFollowedTwitter: onboardingState.hasFollowedTwitter,
    hasJoinedTelegram: onboardingState.hasJoinedTelegram
  };
}