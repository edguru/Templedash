import React, { useState } from 'react';
import { Heart, User, Dog, Sparkles, Save, ArrowLeft } from 'lucide-react';
import { useGameState } from '../../lib/stores/useGameState';

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
}

interface CompanionCreationScreenProps {
  onCompanionCreated: (traits: CompanionTraits) => void;
  onBack: () => void;
}

const CompanionCreationScreen: React.FC<CompanionCreationScreenProps> = ({ onCompanionCreated, onBack }) => {
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
    appearance: ''
  });

  const handleSliderChange = (trait: keyof CompanionTraits, value: number) => {
    setTraits(prev => ({ ...prev, [trait]: value }));
  };

  const handleInputChange = (trait: keyof CompanionTraits, value: string | number) => {
    setTraits(prev => ({ ...prev, [trait]: value }));
  };

  const handleCreate = () => {
    if (!traits.name.trim()) {
      alert('Please enter a name for your companion');
      return;
    }
    onCompanionCreated(traits);
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
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
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
            <div>
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

            {/* Create Button */}
            <button
              onClick={handleCreate}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium flex items-center justify-center space-x-2"
            >
              <Save size={20} />
              <span>Create Companion & Mint Soulbound Token</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanionCreationScreen;