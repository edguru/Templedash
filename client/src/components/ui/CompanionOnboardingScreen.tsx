import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Check, Star, Heart, Sparkles, Bot, User, MessageCircle, Zap } from 'lucide-react';
import { useActiveAccount } from 'thirdweb/react';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  canSkip: boolean;
  estimatedTime: string;
}

interface CompanionOnboardingScreenProps {
  onComplete: () => void;
  onSkip: () => void;
}

export default function CompanionOnboardingScreen({ onComplete, onSkip }: CompanionOnboardingScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isTransitioning, setIsTransitioning] = useState(false);
  const account = useActiveAccount();

  const tutorialSteps: TutorialStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Your AI Companion Journey!',
      description: 'Your personalized AI companion will help you navigate Web3, automate tasks, and provide intelligent assistance.',
      icon: <Sparkles className="text-purple-500" size={32} />,
      content: (
        <div className="text-center space-y-6">
          <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto">
            <Bot className="text-white" size={48} />
          </div>
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-gray-800">Your Personal AI Assistant</h3>
            <p className="text-gray-600">
              Create a unique AI companion that understands your preferences, learns from your interactions, 
              and helps you accomplish tasks across the Web3 ecosystem.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-4 sm:mt-6">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <MessageCircle className="text-blue-500 mx-auto mb-2" size={20} />
                <p className="text-xs sm:text-sm font-medium text-gray-700">Smart Chat</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <Zap className="text-green-500 mx-auto mb-2" size={20} />
                <p className="text-xs sm:text-sm font-medium text-gray-700">Task Automation</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <Heart className="text-purple-500 mx-auto mb-2" size={20} />
                <p className="text-xs sm:text-sm font-medium text-gray-700">Personalized</p>
              </div>
            </div>
          </div>
        </div>
      ),
      canSkip: true,
      estimatedTime: '2 min'
    },
    {
      id: 'companion-design',
      title: 'Design Your Companion',
      description: 'Choose your companion\'s personality, appearance, and relationship style to create the perfect AI assistant for you.',
      icon: <User className="text-blue-500" size={32} />,
      content: (
        <div className="space-y-4 sm:space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <User className="text-white" size={32} />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Customize Your Companion</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 px-2">
              Your companion's personality will shape how they communicate and assist you.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="p-3 sm:p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
              <h4 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">Personality Traits</h4>
              <ul className="text-xs sm:text-sm text-gray-600 space-y-1">
                <li>• Intelligence Level</li>
                <li>• Humor Style</li>
                <li>• Communication Tone</li>
                <li>• Expertise Areas</li>
              </ul>
            </div>
            <div className="p-3 sm:p-4 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors">
              <h4 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">Relationship Type</h4>
              <ul className="text-xs sm:text-sm text-gray-600 space-y-1">
                <li>• Professional Assistant</li>
                <li>• Friendly Advisor</li>
                <li>• Learning Partner</li>
                <li>• Creative Collaborator</li>
              </ul>
            </div>
          </div>
          
          <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
            <p className="text-xs sm:text-sm text-blue-700">
              <strong>Pro Tip:</strong> Your companion will be minted as an NFT, making it uniquely yours and tradeable!
            </p>
          </div>
        </div>
      ),
      canSkip: false,
      estimatedTime: '3 min'
    },
    {
      id: 'features-overview',
      title: 'Companion Capabilities',
      description: 'Discover what your AI companion can do to help you succeed in Web3 and beyond.',
      icon: <Zap className="text-yellow-500" size={32} />,
      content: (
        <div className="space-y-4 sm:space-y-6">
          <div className="text-center mb-4 sm:mb-6">
            <Zap className="text-yellow-500 mx-auto mb-3" size={40} />
            <h3 className="text-lg sm:text-xl font-bold text-gray-800">Your Companion's Superpowers</h3>
          </div>
          
          <div className="grid gap-3 sm:gap-4">
            <div className="flex items-start space-x-3 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <MessageCircle className="text-white" size={14} />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 text-sm sm:text-base">Intelligent Conversations</h4>
                <p className="text-xs sm:text-sm text-gray-600">Natural language processing with context awareness and memory</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 sm:p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Zap className="text-white" size={14} />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 text-sm sm:text-base">Web3 Task Automation</h4>
                <p className="text-xs sm:text-sm text-gray-600">Execute blockchain transactions, check balances, and manage NFTs</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Star className="text-white" size={14} />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 text-sm sm:text-base">Personalized Learning</h4>
                <p className="text-xs sm:text-sm text-gray-600">Adapts to your preferences and grows smarter over time</p>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 p-3 sm:p-4 rounded-lg">
            <p className="text-xs sm:text-sm text-yellow-800">
              <strong>Coming Soon:</strong> Advanced DeFi integration, cross-chain operations, and AI-powered investment insights!
            </p>
          </div>
        </div>
      ),
      canSkip: true,
      estimatedTime: '2 min'
    },
    {
      id: 'ready-to-create',
      title: 'Ready to Create Your Companion?',
      description: 'You\'re all set! Let\'s create your personalized AI companion and mint it as your unique NFT.',
      icon: <Check className="text-green-500" size={32} />,
      content: (
        <div className="text-center space-y-4 sm:space-y-6">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto">
            <Check className="text-white" size={40} />
          </div>
          <div className="space-y-3">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 px-2">You're Ready to Begin!</h3>
            <p className="text-sm sm:text-base text-gray-600 px-4">
              Click "Create My Companion" to start designing your personalized AI assistant. 
              The process takes just a few minutes and your companion will be minted as a unique NFT.
            </p>
          </div>
          
          <div className="bg-green-50 border border-green-200 p-3 sm:p-4 rounded-lg">
            <div className="flex items-center justify-center space-x-2 text-green-700">
              <Heart size={18} />
              <span className="font-medium text-sm sm:text-base">One companion per wallet - Make it count!</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
            <div className="text-center">
              <div className="font-semibold text-gray-800">Estimated Time</div>
              <div className="text-gray-600">3-5 minutes</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-800">Gas Cost</div>
              <div className="text-gray-600">~0.001 CAMP</div>
            </div>
          </div>
        </div>
      ),
      canSkip: false,
      estimatedTime: '1 min'
    }
  ];

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setIsTransitioning(true);
      setCompletedSteps(prev => new Set(prev).add(currentStep));
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setIsTransitioning(false);
      }, 150);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setIsTransitioning(false);
      }, 150);
    }
  };

  const handleSkipTutorial = () => {
    if (confirm('Are you sure you want to skip the tutorial? You can always access help later.')) {
      onSkip();
    }
  };

  const progressPercentage = ((currentStep + 1) / tutorialSteps.length) * 100;
  const currentTutorialStep = tutorialSteps[currentStep];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 overflow-y-auto overflow-x-hidden" 
         style={{ 
           WebkitOverflowScrolling: 'touch',
           touchAction: 'pan-y',
           overscrollBehavior: 'contain'
         }}>
      {/* Header - Mobile Optimized */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles className="text-white" size={16} />
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">Companion Onboarding</h1>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
            <div className="text-xs sm:text-sm text-gray-600">
              {currentStep + 1}/{tutorialSteps.length}
            </div>
            {currentTutorialStep.canSkip && (
              <button
                onClick={handleSkipTutorial}
                className="text-xs sm:text-sm text-gray-500 hover:text-gray-700 transition-colors px-2 py-1"
              >
                Skip
              </button>
            )}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 h-1">
          <div 
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-1 transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Main Content - Mobile Optimized */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-8 min-h-0 flex-1 overflow-y-auto">
        <div className={`transition-all duration-300 ${isTransitioning ? 'opacity-0 transform translate-y-4' : 'opacity-100 transform translate-y-0'}`}>
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-8" 
               style={{ 
                 maxHeight: '85vh',
                 overflowY: 'auto',
                 WebkitOverflowScrolling: 'touch'
               }}>
            {/* Step Header - Mobile Optimized */}
            <div className="text-center mb-6 sm:mb-8">
              <div className="flex items-center justify-center mb-3 sm:mb-4">
                {currentTutorialStep.icon}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 px-2">
                {currentTutorialStep.title}
              </h2>
              <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto px-4">
                {currentTutorialStep.description}
              </p>
              <div className="mt-3">
                <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {currentTutorialStep.estimatedTime} read
                </span>
              </div>
            </div>

            {/* Step Content - Mobile Optimized */}
            <div className="max-w-3xl mx-auto" 
                 style={{ 
                   overflowY: 'auto',
                   maxHeight: '50vh',
                   WebkitOverflowScrolling: 'touch'
                 }}
                 className="sm:overflow-visible sm:max-h-none">
              {currentTutorialStep.content}
            </div>
          </div>
        </div>

        {/* Navigation - Mobile Optimized */}
        <div className="mt-6 sm:mt-8 flex items-center justify-between sticky bottom-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-4 -mx-4 px-4 sm:static sm:bg-transparent sm:py-0 sm:mx-0 sm:px-0">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 rounded-lg transition-colors ${
              currentStep === 0
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            <ChevronLeft size={18} />
            <span className="text-sm sm:text-base">Back</span>
          </button>

          <div className="flex space-x-1.5 sm:space-x-2">
            {tutorialSteps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep
                    ? 'bg-purple-500'
                    : completedSteps.has(index)
                    ? 'bg-green-500'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="flex items-center space-x-1 sm:space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 sm:px-6 py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all text-sm sm:text-base"
          >
            <span>
              {currentStep === tutorialSteps.length - 1 ? (
                <span className="hidden sm:inline">Create My Companion</span>
              ) : (
                'Next'
              )}
              {currentStep === tutorialSteps.length - 1 && (
                <span className="sm:hidden">Create</span>
              )}
            </span>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}