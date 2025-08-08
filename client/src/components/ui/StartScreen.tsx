import { useActiveAccount, useDisconnect } from 'thirdweb/react';
import { useGameState } from "../../lib/stores/useGameState";
import { useNFT } from "../../lib/stores/useNFT";
import { useRewards } from "../../lib/stores/useRewards";


export default function StartScreen() {
  const account = useActiveAccount();
  const { disconnect } = useDisconnect();
  const { startGame, setGamePhase } = useGameState();
  const { hasCharacterNFT, ownedCharacters } = useNFT();
  const { totalCoins, completedRuns, canOpenMysteryBox } = useRewards();


  const handleStartGame = () => {
    // Always show character selection popup (includes shadow + owned NFTs)
    setGamePhase('characterSelectPopup');
  };

  const handleOpenMysteryBox = () => {
    setGamePhase('mysteryBox');
  };

  const handleOpenTutorial = () => {
    setGamePhase('tutorial');
  };

  const handleDisconnect = async () => {
    try {
      disconnect();
    } catch (error) {
      console.log('Disconnect error:', error);
    }
  };

  return (
    <div className="absolute inset-0 bg-gradient-to-b from-blue-400 to-green-400 flex items-start justify-center p-4 pt-8 overflow-y-auto">
      <div className="game-card start-screen-card bg-white/90 rounded-lg max-w-sm w-full mx-auto text-center shadow-2xl p-6 min-h-fit mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-3">Puppet Runner</h1>
        <p className="text-gray-600 mb-4 text-sm">by Puppets AI</p>
        
        {/* Wallet connection */}
        <div className="mb-6">
          <div className="bg-green-100 text-green-800 p-3 rounded-lg">
            <div className="font-semibold">Wallet Connected</div>
            <div className="text-sm font-mono">
              {account?.address?.slice(0, 6)}...{account?.address?.slice(-4)}
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
          
          <button
            onClick={handleOpenTutorial}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            📚 Tutorial & Guide
          </button>
          
          <button
            onClick={() => setGamePhase('mintMore')}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            🎨 Mint More Characters
          </button>
        </div>

        <div className="mt-4 text-xs text-gray-500">
          Collect coins and complete runs to earn rewards!
        </div>
      </div>
    </div>
  );
}
