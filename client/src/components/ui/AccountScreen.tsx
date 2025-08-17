import React from 'react';
import { useActiveAccount, useDisconnect } from 'thirdweb/react';
import { useGameState } from '../../lib/stores/useGameState';
import { useRewards } from '../../lib/stores/useRewards';
import { Wallet, LogOut, User, Settings, Trophy, Coins, Star, Shield } from 'lucide-react';

const AccountScreen: React.FC = () => {
  const account = useActiveAccount();
  const address = account?.address;
  const { disconnect } = useDisconnect();
  const gameState = useGameState();
  const { totalCoins, completedRuns } = useRewards();

  const handleDisconnect = () => {
    disconnect();
  };

  const stats = [
    { label: 'Total Coins', value: totalCoins.toLocaleString(), icon: Coins, color: 'text-yellow-600' },
    { label: 'Games Played', value: completedRuns.toString(), icon: Trophy, color: 'text-blue-600' },
    { label: 'Achievements', value: '12', icon: Star, color: 'text-purple-600' },
    { label: 'Rewards Earned', value: '0.12 CAMP', icon: Shield, color: 'text-green-600' },
  ];

  const achievements = [
    { title: 'First Steps', description: 'Complete your first run', unlocked: true },
    { title: 'Coin Collector', description: 'Collect 1,000 coins', unlocked: true },
    { title: 'Speed Runner', description: 'Run for 60 seconds', unlocked: false },
    { title: 'NFT Owner', description: 'Mint your first character NFT', unlocked: true },
  ];

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
            <User className="text-white" size={32} />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Account</h1>
            <p className="text-gray-600">Manage your profile and preferences</p>
          </div>
          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <Settings size={24} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Wallet Status */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Wallet className="text-indigo-600" size={20} />
            <span>Wallet Connection</span>
          </h2>
          
          {address ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="font-medium text-green-800">Connected</span>
                  </div>
                  <div className="text-sm text-green-600 font-mono mt-1">
                    {address.slice(0, 8)}...{address.slice(-8)}
                  </div>
                </div>
                <button
                  onClick={handleDisconnect}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  <LogOut size={16} />
                  <span>Disconnect</span>
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500">Network</div>
                  <div className="font-semibold text-gray-900">Base Camp</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500">Balance</div>
                  <div className="font-semibold text-gray-900">0.12 CAMP</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="text-gray-400" size={24} />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Wallet Connected</h3>
              <p className="text-gray-600 mb-4">Connect your wallet to access all features</p>
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg transition-colors">
                Connect Wallet
              </button>
            </div>
          )}
        </div>

        {/* Game Statistics */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Trophy className="text-yellow-600" size={20} />
            <span>Game Statistics</span>
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                  <Icon className={`mx-auto mb-2 ${stat.color}`} size={24} />
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Star className="text-purple-600" size={20} />
            <span>Achievements</span>
          </h2>
          
          <div className="space-y-3">
            {achievements.map((achievement, index) => (
              <div
                key={index}
                className={`flex items-center space-x-3 p-3 rounded-lg ${
                  achievement.unlocked ? 'bg-green-50' : 'bg-gray-50'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    achievement.unlocked ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  {achievement.unlocked ? (
                    <Star className="text-white" size={16} />
                  ) : (
                    <Star className="text-gray-500" size={16} />
                  )}
                </div>
                <div className="flex-1">
                  <div className={`font-medium ${achievement.unlocked ? 'text-green-800' : 'text-gray-600'}`}>
                    {achievement.title}
                  </div>
                  <div className={`text-sm ${achievement.unlocked ? 'text-green-600' : 'text-gray-500'}`}>
                    {achievement.description}
                  </div>
                </div>
                {achievement.unlocked && (
                  <div className="text-green-600 font-bold text-sm">Unlocked</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Settings className="text-gray-600" size={20} />
            <span>Settings</span>
          </h2>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
              <span className="text-gray-700">Notifications</span>
              <div className="w-12 h-6 bg-green-500 rounded-full relative">
                <div className="w-5 h-5 bg-white rounded-full absolute right-1 top-0.5"></div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
              <span className="text-gray-700">Sound Effects</span>
              <div className="w-12 h-6 bg-green-500 rounded-full relative">
                <div className="w-5 h-5 bg-white rounded-full absolute right-1 top-0.5"></div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
              <span className="text-gray-700">Auto-save Progress</span>
              <div className="w-12 h-6 bg-green-500 rounded-full relative">
                <div className="w-5 h-5 bg-white rounded-full absolute right-1 top-0.5"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountScreen;