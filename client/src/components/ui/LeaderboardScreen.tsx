import { useState, useEffect } from "react";
import { useGameState } from "../../lib/stores/useGameState";

interface LeaderboardEntry {
  userId: number;
  username: string | null;
  walletAddress: string;
  bestScore: number;
  totalGames: number;
  totalCoins: number;
}

export default function LeaderboardScreen() {
  const { setGamePhase } = useGameState();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('/api/leaderboard');
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }
      const data = await response.json();
      setLeaderboard(data);
    } catch (err) {
      setError('Failed to load leaderboard');
      console.error('Leaderboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setGamePhase('start');
  };

  const formatWalletAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (loading) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-green-500 flex items-center justify-center">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-green-500 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">🏆 Leaderboard</h1>
          <p className="text-gray-600">Top Temple Runners</p>
        </div>

        {/* Leaderboard Content */}
        <div className="flex-1 overflow-y-auto">
          {error ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchLeaderboard}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Retry
              </button>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">No scores yet!</p>
              <p className="text-sm text-gray-500">Be the first to play and claim your spot!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((entry, index) => (
                <div
                  key={entry.userId}
                  className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                    index === 0 ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 border-2 border-yellow-400' :
                    index === 1 ? 'bg-gradient-to-r from-gray-100 to-gray-200 border-2 border-gray-400' :
                    index === 2 ? 'bg-gradient-to-r from-orange-100 to-orange-200 border-2 border-orange-400' :
                    'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full mr-4 font-bold ${
                      index === 0 ? 'bg-yellow-500 text-white' :
                      index === 1 ? 'bg-gray-500 text-white' :
                      index === 2 ? 'bg-orange-500 text-white' :
                      'bg-blue-500 text-white'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">
                        {entry.username || `Player ${formatWalletAddress(entry.walletAddress)}`}
                      </div>
                      <div className="text-sm text-gray-600">
                        {entry.totalGames} games • {entry.totalCoins} coins
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg text-gray-800">
                      {entry.bestScore?.toLocaleString() || 0}
                    </div>
                    <div className="text-sm text-gray-600">best score</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Back Button */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={handleBack}
            className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-xl transition-colors"
          >
            Back to Menu
          </button>
        </div>
      </div>
    </div>
  );
}