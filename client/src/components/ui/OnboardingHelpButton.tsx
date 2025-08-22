import React, { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { useCompanionOnboarding } from '../../hooks/useCompanionOnboarding';
import CompanionOnboardingScreen from './CompanionOnboardingScreen';

interface OnboardingHelpButtonProps {
  className?: string;
}

export default function OnboardingHelpButton({ className = '' }: OnboardingHelpButtonProps) {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { resetOnboarding, completeOnboarding } = useCompanionOnboarding();

  const handleOpenOnboarding = () => {
    resetOnboarding(); // Reset to see full tutorial again
    setShowOnboarding(true);
  };

  const handleOnboardingComplete = () => {
    completeOnboarding();
    setShowOnboarding(false);
  };

  const handleOnboardingClose = () => {
    setShowOnboarding(false);
  };

  if (showOnboarding) {
    return (
      <div className="fixed inset-0 z-50">
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={handleOnboardingClose}
            className="bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition-colors"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>
        <CompanionOnboardingScreen
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingClose}
        />
      </div>
    );
  }

  return (
    <button
      onClick={handleOpenOnboarding}
      className={`flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors ${className}`}
      title="View Companion Tutorial"
    >
      <HelpCircle size={20} />
      <span className="text-sm">Tutorial</span>
    </button>
  );
}