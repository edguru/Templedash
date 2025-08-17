import React from 'react';
import { Heart, Sparkles, ArrowRight, X } from 'lucide-react';
import { useGameState } from '../../lib/stores/useGameState';

interface CompanionPromptScreenProps {
  onCreateCompanion: () => void;
  onSkip: () => void;
}

const CompanionPromptScreen: React.FC<CompanionPromptScreenProps> = ({ onCreateCompanion, onSkip }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
        {/* Close button */}
        <button
          onClick={onSkip}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={24} />
        </button>

        {/* Content */}
        <div className="text-center">
          {/* Icon */}
          <div className="w-20 h-20 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart size={40} className="text-white" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-800 mb-3">
            Create Your AI Companion
          </h1>

          {/* Description */}
          <p className="text-gray-600 mb-6 leading-relaxed">
            Design your perfect AI companion to help you with Web3 tasks, provide personalized assistance, and be your digital partner in this journey.
          </p>

          {/* Features */}
          <div className="space-y-3 mb-8">
            <div className="flex items-center text-left">
              <Sparkles size={16} className="text-purple-500 mr-3 flex-shrink-0" />
              <span className="text-sm text-gray-700">Customize personality, role, and traits</span>
            </div>
            <div className="flex items-center text-left">
              <Sparkles size={16} className="text-purple-500 mr-3 flex-shrink-0" />
              <span className="text-sm text-gray-700">Minted as a soulbound NFT token</span>
            </div>
            <div className="flex items-center text-left">
              <Sparkles size={16} className="text-purple-500 mr-3 flex-shrink-0" />
              <span className="text-sm text-gray-700">Modify traits anytime you want</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            <button
              onClick={onCreateCompanion}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium flex items-center justify-center space-x-2"
            >
              <Heart size={20} />
              <span>Create My Companion</span>
              <ArrowRight size={20} />
            </button>
            
            <button
              onClick={onSkip}
              className="w-full text-gray-500 hover:text-gray-700 transition-colors font-medium py-2"
            >
              Maybe later
            </button>
          </div>

          {/* Note */}
          <p className="text-xs text-gray-500 mt-4">
            Costs 0.001 CAMP to mint • Can be created later from settings
          </p>
        </div>
      </div>
    </div>
  );
};

export default CompanionPromptScreen;