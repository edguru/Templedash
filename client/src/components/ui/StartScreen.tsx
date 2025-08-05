import { useGameState } from "../../lib/stores/useGameState";
import { useNFT } from "../../lib/stores/useNFT";
import { useRewards } from "../../lib/stores/useRewards";
import { useAuth } from "../../lib/stores/useAuth";
import { useActiveAccount, useDisconnect } from "thirdweb/react";

export default function StartScreen() {
  const { startGame, setGamePhase } = useGameState();
  const { hasCharacterNFT } = useNFT();
  const { totalCoins, completedRuns, canOpenMysteryBox } = useRewards();
  const { user, logout } = useAuth();
  const account = useActiveAccount();
  const { disconnect } = useDisconnect();

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
      if (disconnect) {
        await disconnect();
      }
    } catch (error) {
      console.log('Disconnect error:', error); 
    } finally {
      logout();
    }
  };

  return (
    <div className="absolute inset-0 bg-gradient-to-b from-blue-400 to-green-400 flex items-center justify-center p-4">
      <div className="game-card start-screen-card bg-white/90 rounded-lg w-full text-center shadow-2xl">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Temple Runner</h1>
        <p className="text-gray-600 mb-6">NFT-Powered Infinite Runner</p>
        
        {/* Wallet connection */}
        <div className="mb-6">
          <div className="bg-green-100 text-green-800 p-3 rounded-lg">
            <div className="font-semibold">Wallet Connected</div>
            <div className="text-sm font-mono">
              {user?.walletAddress?.slice(0, 6)}...{user?.walletAddress?.slice(-4)}
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
        </div>

        <div className="mt-4 text-xs text-gray-500">
          Collect coins and complete runs to earn rewards!
        </div>
      </div>
    </div>
  );
}
