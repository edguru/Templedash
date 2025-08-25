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
        {/* Enhanced close button with better mobile visibility */}
        <div className="absolute top-4 right-4 z-50 pointer-events-auto">
          <button
            onClick={handleOnboardingClose}
            className="bg-white rounded-full p-3 shadow-xl hover:bg-gray-50 transition-colors border border-gray-200 flex items-center justify-center"
            style={{ minWidth: '44px', minHeight: '44px' }}
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