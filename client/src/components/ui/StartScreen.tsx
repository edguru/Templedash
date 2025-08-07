import { useGameState } from "../../lib/stores/useGameState";
import { useNFT } from "../../lib/stores/useNFT";
import { useRewards } from "../../lib/stores/useRewards";
import { useAuth } from "../../lib/stores/useAuth";
import { usePrivy } from '@privy-io/react-auth';

export default function StartScreen() {
  const { startGame, setGamePhase } = useGameState();
  const { hasCharacterNFT } = useNFT();
  const { totalCoins, completedRuns, canOpenMysteryBox } = useRewards();
  const { logout } = useAuth();
  const { user, logout: privyLogout } = usePrivy();

  const handleStartGame = () => {
    if (!hasCharacterNFT) {
      setGamePhase('mint');
    } else {
      startGame();
    }
  };

  const handleOpenMysteryBox = () => {
    setGamePhase('mysteryBox');
  };

  const handleDisconnect = async () => {
    try {
      await privyLogout();
      logout();
    } catch (error) {
      console.log('Disconnect error:', error); 
      logout();
    }
  };

  return (
    <div className="absolute inset-0 bg-gradient-to-b from-blue-400 to-green-400 flex items-center justify-center p-4">
      <div className="game-card start-screen-card bg-white/90 rounded-lg max-w-sm w-full mx-auto text-center shadow-2xl p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-3">Temple Runner</h1>
        <p className="text-gray-600 mb-4 text-sm">NFT-Powered Infinite Runner</p>
        
        {/* Wallet connection */}
        <div className="mb-6">
          <div className="bg-green-100 text-green-800 p-3 rounded-lg">
            <div className="font-semibold">Wallet Connected</div>
            <div className="text-sm font-mono">
              {user?.wallet?.address?.slice(0, 6)}...{user?.wallet?.address?.slice(-4)}
            </div>
            <button
              onClick={handleDisconnect}
              className="mt-2 text-sm text-green-600 hover:text-green-800 underline"
            >
              Disconnect Wallet
            </button>
          </div>
        </div>

        {/* Game stats */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div className="bg-gray-100 p-3 rounded">
            <div className="font-semibold">Coins</div>
            <div className="text-xl text-yellow-600">{totalCoins}</div>
          </div>
          <div className="bg-gray-100 p-3 rounded">
            <div className="font-semibold">Runs</div>
            <div className="text-xl text-blue-600">{completedRuns}</div>
          </div>
        </div>

        {/* Character status */}
        <div className="mb-6 p-4 bg-gray-100 rounded-lg">
          <div className="text-sm font-semibold mb-2">Character Status</div>
          {hasCharacterNFT ? (
            <div className="text-green-600">✅ Character Unlocked</div>
          ) : (
            <div className="text-orange-600">🔒 Shadow Character Only</div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6 flex bg-gray-100 rounded-xl p-1">
          <button className="flex-1 bg-white shadow-sm rounded-lg py-2 px-4 text-sm font-medium text-green-600 border border-green-200">
            Game
          </button>
          <button 
            onClick={() => setGamePhase('chat')}
            className="flex-1 py-2 px-4 text-sm font-medium text-gray-500 hover:text-purple-600 transition-colors"
          >
            Chat Companion
          </button>
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          {/* Big Play Button */}
          <button
            onClick={handleStartGame}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-8 rounded-xl transition-all transform hover:scale-105 flex items-center justify-center text-xl shadow-lg"
          >
            <span className="mr-3 text-2xl">▶️</span>
            {hasCharacterNFT ? "PLAY GAME" : "UNLOCK & PLAY"}
          </button>
          
          {canOpenMysteryBox && (
            <button
              onClick={handleOpenMysteryBox}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-lg transition-colors animate-pulse"
            >
              🎁 OPEN MYSTERY BOX
            </button>
          )}

          <button
            onClick={() => setGamePhase('leaderboard')}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            🏆 Leaderboard
          </button>
          
          <button 
            onClick={() => setGamePhase('profile')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-200 hover:scale-105 shadow-lg"
          >
            👤 Profile
          </button>
        </div>

        <div className="mt-4 text-xs text-gray-500">
          Collect coins and complete runs to earn rewards!
        </div>
      </div>
    </div>
  );
}
