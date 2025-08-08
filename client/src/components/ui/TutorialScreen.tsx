import { useState } from 'react';
import { useGameState } from "../../lib/stores/useGameState";
import { useOnboarding } from "../../hooks/useOnboarding";

interface TutorialStep {
  id: string;
  title: string;
  content: string;
  visual: string;
  controls?: string[];
}

export default function TutorialScreen() {
  const { setGamePhase } = useGameState();
  const { setHasSeenTutorial } = useOnboarding();
  const [currentStep, setCurrentStep] = useState(0);

  const tutorialSteps: TutorialStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Puppet Runner!',
      content: 'A Temple Run-style infinite runner game where you collect coins, avoid obstacles, and unlock NFT characters!',
      visual: '🎮',
    },
    {
      id: 'controls',
      title: 'Game Controls',
      content: 'Master the controls to become a pro runner!',
      visual: '⌨️',
      controls: [
        'A or ← : Move Left',
        'D or → : Move Right', 
        'Space : Jump',
        'On Mobile: Use touch buttons'
      ]
    },
    {
      id: 'gameplay',
      title: 'How to Play',
      content: 'Run forward automatically, switch lanes to avoid obstacles, collect coins for points!',
      visual: '🏃‍♂️',
    },
    {
      id: 'characters',
      title: 'Character System',
      content: 'Start as shadow character. Mint NFTs to unlock unique characters with special appearances!',
      visual: '🥷',
    },
    {
      id: 'nft-minting',
      title: 'NFT Characters',
      content: 'Each NFT = One unique character. Mint multiple to build your collection!',
      visual: '🚀',
      controls: [
        '🥷 Ninja Warrior (Red)',
        '🚀 Space Ranger (Blue)',
        '🔮 Crystal Mage (Purple)'
      ]
    },
    {
      id: 'mystery-box',
      title: 'Mystery Boxes',
      content: 'Earn mystery boxes by playing! Open them for PUPPETS token rewards. Jackpot chance: 1 in 5000!',
      visual: '🎁',
    },
    {
      id: 'profile',
      title: 'Player Profile',
      content: 'Track your progress, view owned characters, check leaderboards, and claim rewards!',
      visual: '👤',
    },
    {
      id: 'ready',
      title: 'Ready to Play!',
      content: 'You\'re all set! Remember: collect coins, avoid obstacles, and have fun running!',
      visual: '🎯',
    }
  ];

  const currentTutorial = tutorialSteps[currentStep];

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setHasSeenTutorial(true);
      setGamePhase('start');
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    setHasSeenTutorial(true);
    setGamePhase('start');
  };

  return (
    <div className="absolute inset-0 bg-gradient-to-b from-indigo-600 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-auto text-center shadow-2xl">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Tutorial Progress</span>
            <span className="text-sm text-gray-600">{currentStep + 1} / {tutorialSteps.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Tutorial Content */}
        <div className="mb-6">
          {/* Pixel-style Visual */}
          <div className="text-6xl mb-4 pixel-font">
            {currentTutorial.visual}
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-3 pixel-font">
            {currentTutorial.title}
          </h2>
          
          <p className="text-gray-600 mb-4 pixel-font">
            {currentTutorial.content}
          </p>

          {/* Controls/Features List */}
          {currentTutorial.controls && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <ul className="text-sm text-gray-700 space-y-2">
                {currentTutorial.controls.map((control, index) => (
                  <li key={index} className="pixel-font font-mono bg-white px-3 py-1 rounded border">
                    {control}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white px-4 py-2 rounded transition-colors pixel-font"
          >
            ← Previous
          </button>

          <button
            onClick={handleSkip}
            className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded transition-colors text-sm pixel-font"
          >
            Skip Tutorial
          </button>

          <button
            onClick={handleNext}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded transition-colors pixel-font"
          >
            {currentStep === tutorialSteps.length - 1 ? 'Start Playing!' : 'Next →'}
          </button>
        </div>

        {/* Tutorial completion indicator */}
        {currentStep === tutorialSteps.length - 1 && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <p className="text-green-700 text-sm pixel-font">
              🎉 Tutorial completed! You can access this tutorial anytime from the menu.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}