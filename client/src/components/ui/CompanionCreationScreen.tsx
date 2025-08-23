import React, { useState } from 'react';
import { Heart, User, Dog, Sparkles, Save, ArrowLeft, Loader2, CheckCircle, AlertCircle, Copy, Check, Wallet } from 'lucide-react';
import { useGameState } from '../../lib/stores/useGameState';
import { useCompanionOnboarding } from '../../hooks/useCompanionOnboarding';
import { useActiveAccount } from 'thirdweb/react';
import CompanionOnboardingScreen from './CompanionOnboardingScreen';

interface CompanionTraits {
  name: string;
  age: number;
  role: 'partner' | 'friend' | 'pet';
  gender: 'male' | 'female' | 'non-binary';
  flirtiness: number;
  intelligence: number;
  humor: number;
  loyalty: number;
  empathy: number;
  personalityType: 'helpful' | 'casual' | 'professional';
  appearance: string;
  backgroundStory?: string;
}

interface CompanionCreationScreenProps {
  onCompanionCreated: (traits: CompanionTraits) => Promise<void>;
  onBack: () => void;
}

const CompanionCreationScreen: React.FC<CompanionCreationScreenProps> = ({ onCompanionCreated, onBack }) => {
  const { shouldShowOnboarding, completeOnboarding, skipOnboarding } = useCompanionOnboarding();
  const [showOnboarding, setShowOnboarding] = useState(shouldShowOnboarding());
  const account = useActiveAccount();
  
  const [traits, setTraits] = useState<CompanionTraits>({
    name: '',
    age: 25,
    role: 'friend',
    gender: 'non-binary',
    flirtiness: 50,
    intelligence: 80,
    humor: 70,
    loyalty: 90,
    empathy: 85,
    personalityType: 'helpful',
    appearance: '',
    backgroundStory: ''
  });

  const [isCreating, setIsCreating] = useState(false);
  const [creationStep, setCreationStep] = useState('');
  const [error, setError] = useState('');
  const [addressCopied, setAddressCopied] = useState(false);

  const handleOnboardingComplete = () => {
    completeOnboarding();
    setShowOnboarding(false);
  };

  const handleOnboardingSkip = () => {
    skipOnboarding();
    setShowOnboarding(false);
  };

  // Show onboarding if user hasn't seen it yet
  if (showOnboarding) {
    return (
      <CompanionOnboardingScreen
        onComplete={handleOnboardingComplete}
        onSkip={handleOnboardingSkip}
      />
    );
  }

  const handleSliderChange = (trait: keyof CompanionTraits, value: number) => {
    setTraits(prev => ({ ...prev, [trait]: value }));
  };

  const handleInputChange = (trait: keyof CompanionTraits, value: string | number) => {
    setTraits(prev => ({ ...prev, [trait]: value }));
  };

  const handleCreate = async () => {
    if (!traits.name.trim()) {
      setError('Please enter a name for your companion');
      return;
    }
    
    setIsCreating(true);
    setError('');
    setCreationStep('Preparing NFT minting transaction...');
    
    try {
      await onCompanionCreated(traits);
    } catch (error) {
      console.error('Creation failed:', error);
      setError(`Failed to create companion: ${(error as Error).message}`);
      setIsCreating(false);
      setCreationStep('');
    }
  };

  const handleCopyAddress = async () => {
    if (!account?.address) return;
    
    try {
      await navigator.clipboard.writeText(account.address);
      setAddressCopied(true);
      setTimeout(() => setAddressCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  const roleIcons = {
    partner: Heart,
    friend: User,
    pet: Dog
  };

  const RoleIcon = roleIcons[traits.role];

  return (
    <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 min-h-screen overflow-y-auto overscroll-behavior-y-contain">
      <div className="max-w-2xl mx-auto p-4 pb-12 relative" style={{ minHeight: 'calc(100vh - 2rem)' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pt-4">
          <button
            onClick={onBack}
            disabled={isCreating}
            className={`flex items-center space-x-2 transition-colors ${
              isCreating 
                ? 'text-gray-400 cursor-not-allowed' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Create Your Companion</h1>
            <p className="text-gray-600">Design your perfect AI companion</p>
          </div>
          <div className="w-20"></div> {/* Spacer for center alignment */}
        </div>

        {/* Preview Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
              <RoleIcon size={32} className="text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-800">
                {traits.name || 'Your Companion'}
              </h2>
              <p className="text-gray-600 capitalize">
                {traits.age} years old • {traits.role} • {traits.gender}
              </p>
              <p className="text-sm text-purple-600 capitalize font-medium">
                {traits.personalityType} personality
              </p>
            </div>
          </div>

          {/* Wallet Address Display */}
          {account?.address && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Wallet className="text-gray-500" size={20} />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Your Wallet Address</p>
                    <p className="text-xs text-gray-500 font-mono">
                      {`${account.address.slice(0, 6)}...${account.address.slice(-4)}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCopyAddress}
                  className="flex items-center space-x-2 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {addressCopied ? (
                    <>
                      <Check size={16} className="text-green-500" />
                      <span className="text-green-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={16} className="text-gray-500" />
                      <span className="text-gray-600">Copy</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                This companion NFT will be minted to the above address
              </p>
            </div>
          )}
        </div>

        {/* Creation Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-6">
          <div className="space-y-8">
            {/* Basic Info */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Sparkles className="mr-2" size={20} />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    value={traits.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter companion name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                  <input
                    type="number"
                    min="18"
                    max="100"
                    value={traits.age}
                    onChange={(e) => handleInputChange('age', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Relationship Role</label>
              <div className="grid grid-cols-3 gap-3">
                {(['partner', 'friend', 'pet'] as const).map((role) => {
                  const Icon = roleIcons[role];
                  return (
                    <button
                      key={role}
                      onClick={() => handleInputChange('role', role)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        traits.role === role
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <Icon size={24} className="mx-auto mb-1" />
                      <div className="text-sm font-medium capitalize">{role}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Gender Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
              <div className="grid grid-cols-3 gap-3">
                {(['male', 'female', 'non-binary'] as const).map((gender) => (
                  <button
                    key={gender}
                    onClick={() => handleInputChange('gender', gender)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      traits.gender === gender
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <div className="text-sm font-medium capitalize">{gender.replace('-', ' ')}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Personality Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Personality Type</label>
              <div className="grid grid-cols-3 gap-3">
                {(['helpful', 'casual', 'professional'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => handleInputChange('personalityType', type)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      traits.personalityType === type
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <div className="text-sm font-medium capitalize">{type}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Personality Traits */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Personality Traits</h3>
              <div className="space-y-4">
                {[
                  { key: 'flirtiness', label: 'Flirtiness', color: 'pink' },
                  { key: 'intelligence', label: 'Intelligence', color: 'blue' },
                  { key: 'humor', label: 'Humor', color: 'yellow' },
                  { key: 'loyalty', label: 'Loyalty', color: 'green' },
                  { key: 'empathy', label: 'Empathy', color: 'purple' }
                ].map(({ key, label, color }) => (
                  <div key={key}>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-gray-700">{label}</label>
                      <span className="text-sm text-gray-500">{traits[key as keyof CompanionTraits]}/100</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={traits[key as keyof CompanionTraits]}
                      onChange={(e) => handleSliderChange(key as keyof CompanionTraits, parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Appearance Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Appearance Description (Optional)</label>
              <textarea
                value={traits.appearance}
                onChange={(e) => handleInputChange('appearance', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={3}
                placeholder="Describe how you'd like your companion to look..."
              />
            </div>

            {/* Background Story */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Background Story (Optional)</label>
              <textarea
                value={traits.backgroundStory || ''}
                onChange={(e) => handleInputChange('backgroundStory', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={4}
                placeholder="Create a unique background story for your companion - their history, interests, experiences, or any personal details that make them special..."
              />
              <p className="text-xs text-gray-500 mt-1">
                This helps your companion understand their identity and creates more personalized conversations
              </p>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2 text-red-700">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            {/* Progress Display */}
            {isCreating && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <Loader2 size={20} className="animate-spin text-blue-600" />
                  <span className="text-blue-700 font-medium">Creating Your Companion NFT</span>
                </div>
                <div className="text-sm text-blue-600">
                  {creationStep || 'Please approve transactions in your wallet...'}
                </div>
                <div className="mt-3 text-xs text-blue-500">
                  • Minting your companion NFT on Base Camp Testnet (0.001 CAMP fee)<br/>
                  • Setting companion traits on blockchain<br/>
                  • Multiple transactions required - please don't close this window
                </div>
              </div>
            )}

            {/* Create Button */}
            <button
              onClick={handleCreate}
              disabled={isCreating || !traits.name.trim()}
              className={`w-full py-3 px-6 rounded-lg font-medium flex items-center justify-center space-x-2 transition-all ${
                isCreating || !traits.name.trim()
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
              }`}
            >
              {isCreating ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Minting NFT...</span>
                </>
              ) : (
                <>
                  <Save size={20} />
                  <span>Create Companion & Mint NFT</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanionCreationScreen;