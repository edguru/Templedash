import React, { useState } from 'react';
import { Edit3, Heart, User, Dog, Sparkles, Save, ArrowLeft, Settings } from 'lucide-react';
import { useActiveAccount } from 'thirdweb/react';

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
  tokenId?: number;
  createdAt?: string;
  lastModified?: string;
}

interface CompanionManagementScreenProps {
  companion: CompanionTraits;
  onCompanionUpdated: (traits: CompanionTraits) => void;
  onBack: () => void;
}

const CompanionManagementScreen: React.FC<CompanionManagementScreenProps> = ({ 
  companion, 
  onCompanionUpdated, 
  onBack 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [traits, setTraits] = useState<CompanionTraits>(companion);
  const [isUpdating, setIsUpdating] = useState(false);
  const account = useActiveAccount();

  const handleSliderChange = (trait: keyof CompanionTraits, value: number) => {
    setTraits(prev => ({ ...prev, [trait]: value }));
  };

  const handleInputChange = (trait: keyof CompanionTraits, value: string | number) => {
    setTraits(prev => ({ ...prev, [trait]: value }));
  };

  const handleSave = async () => {
    if (!traits.name.trim()) {
      alert('Please enter a name for your companion');
      return;
    }
    
    setIsUpdating(true);
    try {
      await onCompanionUpdated(traits);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating companion:', error);
      alert('Failed to update companion. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setTraits(companion);
    setIsEditing(false);
  };

  const roleIcons = {
    partner: Heart,
    friend: User,
    pet: Dog
  };

  const RoleIcon = roleIcons[traits.role];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Your Companion</h1>
            <p className="text-gray-600">Manage your AI companion</p>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center space-x-2 text-purple-600 hover:text-purple-800 transition-colors"
          >
            {isEditing ? <Settings size={20} /> : <Edit3 size={20} />}
            <span>{isEditing ? 'View' : 'Edit'}</span>
          </button>
        </div>

        {/* Companion Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
              <RoleIcon size={36} className="text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-800">{traits.name}</h2>
              <p className="text-gray-600 capitalize">
                {traits.age} years old • {traits.role} • {traits.gender}
              </p>
              <p className="text-sm text-purple-600 capitalize font-medium">
                {traits.personalityType} personality
              </p>
            </div>
          </div>

          {/* Token Info */}
          {companion.tokenId && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Token ID:</span>
                  <span className="ml-2 font-mono">#{companion.tokenId}</span>
                </div>
                <div>
                  <span className="text-gray-600">Owner:</span>
                  <span className="ml-2 font-mono text-xs">
                    {account?.address ? `${account.address.slice(0, 6)}...${account.address.slice(-4)}` : 'Unknown'}
                  </span>
                </div>
                {companion.createdAt && (
                  <div>
                    <span className="text-gray-600">Created:</span>
                    <span className="ml-2">{new Date(companion.createdAt).toLocaleDateString()}</span>
                  </div>
                )}
                {companion.lastModified && (
                  <div>
                    <span className="text-gray-600">Modified:</span>
                    <span className="ml-2">{new Date(companion.lastModified).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Personality Traits Display */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'flirtiness', label: 'Flirtiness', color: 'pink' },
              { key: 'intelligence', label: 'Intelligence', color: 'blue' },
              { key: 'humor', label: 'Humor', color: 'yellow' },
              { key: 'loyalty', label: 'Loyalty', color: 'green' },
              { key: 'empathy', label: 'Empathy', color: 'purple' }
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{label}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-400 to-pink-400 transition-all"
                      style={{ width: `${traits[key as keyof CompanionTraits]}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 w-8">
                    {traits[key as keyof CompanionTraits]}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {traits.appearance && (
            <div className="mt-4">
              <span className="text-sm font-medium text-gray-700">Appearance:</span>
              <p className="text-gray-600 text-sm mt-1">{traits.appearance}</p>
            </div>
          )}
        </div>

        {/* Edit Form */}
        {isEditing && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="space-y-6">
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

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button
                  onClick={handleSave}
                  disabled={isUpdating}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <Save size={20} />
                  <span>{isUpdating ? 'Updating...' : 'Save Changes'}</span>
                </button>
                <button
                  onClick={handleCancel}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanionManagementScreen;