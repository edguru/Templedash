import { useGameState } from "../../lib/stores/useGameState";
import { useRewards } from "../../lib/stores/useRewards";

export default function GameOverScreen() {
  const { score, distance, restartGame, setGamePhase } = useGameState();
  const { addCoins, addRun, canOpenMysteryBox } = useRewards();

  const coinsEarned = Math.floor(score / 10);

  const handleRestart = () => {
    // Add rewards
    addCoins(coinsEarned);
    addRun();
    
    // Restart game
    restartGame();
  };

  const handleMainMenu = () => {
    // Add rewards
    addCoins(coinsEarned);
    addRun();
    
    // Go to main menu
    setGamePhase('start');
  };

  const handleMysteryBox = () => {
    // Add rewards
    addCoins(coinsEarned);
    addRun();
    
    // Go to mystery box
    setGamePhase('mysteryBox');
  };

  return (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center shadow-2xl">
        <h1 className="text-3xl font-bold text-red-600 mb-4">Game Over!</h1>
        
        {/* Game stats */}
        <div className="space-y-3 mb-6">
          <div className="bg-gray-100 p-3 rounded">
            <div className="text-sm text-gray-600">Final Score</div>
            <div className="text-2xl font-bold text-blue-600">{score}</div>
          </div>
          
          <div className="bg-gray-100 p-3 rounded">
            <div className="text-sm text-gray-600">Distance Traveled</div>
            <div className="text-xl font-semibold">{Math.floor(distance)}m</div>
          </div>
          
          <div className="bg-yellow-100 p-3 rounded">
            <div className="text-sm text-gray-600">Coins Earned</div>
            <div className="text-xl font-bold text-yellow-600">+{coinsEarned}</div>
          </div>
        </div>

        {/* Mystery box notification */}
        {canOpenMysteryBox && (
          <div className="bg-purple-100 p-3 rounded-lg mb-6 animate-pulse">
            <div className="text-purple-700 font-semibold">🎁 Mystery Box Available!</div>
            <div className="text-sm text-purple-600">You've earned a reward box!</div>
          </div>
        )}

        {/* Action buttons */}
        <div className="space-y-3">
          {canOpenMysteryBox && (
            <button
              onClick={handleMysteryBox}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              🎁 OPEN MYSTERY BOX
            </button>
          )}
          
          <button
            onClick={handleRestart}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            PLAY AGAIN
          </button>
          
          <button
            onClick={handleMainMenu}
            className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
}
