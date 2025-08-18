import React from 'react';
import { useGameState } from '../../lib/stores/useGameState';
import { Play, Trophy, Star, Gamepad2 } from 'lucide-react';

const MiniGamesScreen: React.FC = () => {
  const { setGamePhase } = useGameState();

  const games = [
    {
      id: 'puppet-runner',
      title: 'Puppet Runner',
      description: 'NFT-powered infinite runner with blockchain rewards',
      image: '/images/hero-image.png',
      status: 'available',
      difficulty: 'Medium',
      rewards: 'CAMP tokens + NFTs',
      players: '1.2k',
      rating: 4.8
    },

  ];

  const handlePlayGame = (gameId: string) => {
    if (gameId === 'puppet-runner') {
      // Navigate to the game
      setGamePhase('start');
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
            <Gamepad2 className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mini Games</h1>
            <p className="text-gray-600">Play, earn, and collect rewards</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <Play className="text-green-600" size={20} />
              <span className="text-green-600 font-semibold">Games Played</span>
            </div>
            <div className="text-2xl font-bold text-green-900 mt-1">247</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <Trophy className="text-yellow-600" size={20} />
              <span className="text-yellow-600 font-semibold">High Score</span>
            </div>
            <div className="text-2xl font-bold text-yellow-900 mt-1">15,420</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <Star className="text-purple-600" size={20} />
              <span className="text-purple-600 font-semibold">Rewards</span>
            </div>
            <div className="text-2xl font-bold text-purple-900 mt-1">0.12 CAMP</div>
          </div>
        </div>
      </div>

      {/* Games Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <div key={game.id} className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
              {/* Game Image */}
              <div className="relative h-48 bg-gradient-to-r from-purple-400 to-blue-500">
                <img 
                  src={game.image} 
                  alt={game.title}
                  className="w-full h-full object-cover"
                />
                {game.status === 'coming-soon' && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <span className="bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-bold">
                      Coming Soon
                    </span>
                  </div>
                )}
              </div>

              {/* Game Info */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-bold text-gray-900">{game.title}</h3>
                  {game.status === 'available' && (
                    <div className="flex items-center space-x-1">
                      <Star className="text-yellow-400 fill-current" size={16} />
                      <span className="text-sm text-gray-600">{game.rating}</span>
                    </div>
                  )}
                </div>

                <p className="text-gray-600 text-sm mb-4">{game.description}</p>

                {/* Game Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Difficulty:</span>
                    <span className={`font-medium ${
                      game.difficulty === 'Easy' ? 'text-green-600' :
                      game.difficulty === 'Medium' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {game.difficulty}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Rewards:</span>
                    <span className="font-medium text-purple-600">{game.rewards}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Players:</span>
                    <span className="font-medium text-blue-600">{game.players}</span>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => handlePlayGame(game.id)}
                  disabled={game.status !== 'available'}
                  className={`w-full py-3 px-4 rounded-lg font-bold transition-colors flex items-center justify-center space-x-2 ${
                    game.status === 'available'
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Play size={20} />
                  <span>{game.status === 'available' ? 'Play Now' : 'Coming Soon'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Featured Section */}
        <div className="mt-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">🎮 Game of the Week</h2>
          <p className="text-purple-100 mb-4">
            Puppet Runner is trending! Join thousands of players earning real crypto rewards through gameplay.
          </p>
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold">1.2k+</div>
              <div className="text-sm text-purple-200">Active Players</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">$2.5k</div>
              <div className="text-sm text-purple-200">Total Rewards</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">4.8⭐</div>
              <div className="text-sm text-purple-200">Player Rating</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiniGamesScreen;