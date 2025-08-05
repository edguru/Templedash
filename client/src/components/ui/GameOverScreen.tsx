import { useGameState } from "../../lib/stores/useGameState";
import { useRewards } from "../../lib/stores/useRewards";
import { useAuth } from "../../lib/stores/useAuth";
import { useEffect, useState } from "react";

export default function GameOverScreen() {
  const { score, distance, restartGame, setGamePhase } = useGameState();
  const { addCoins, addRun, canOpenMysteryBox } = useRewards();
  const { token } = useAuth();
  const [scoreSaved, setScoreSaved] = useState(false);
  const [isPersonalBest, setIsPersonalBest] = useState(false);

  const coinsEarned = Math.floor(score / 10);

  // Save score when component mounts
  useEffect(() => {
    const saveScore = async () => {
      if (!token || scoreSaved) return;
      
      try {
        const response = await fetch('/api/scores', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            score,
            distance: Math.floor(distance),
            coinsCollected: coinsEarned
          })
        });

        if (response.ok) {
          const result = await response.json();
          setIsPersonalBest(result.isPersonalBest);
          setScoreSaved(true);
        }
      } catch (error) {
        console.error('Failed to save score:', error);
      }
    };

    saveScore();
  }, [token, score, distance, coinsEarned, scoreSaved]);

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
        
        {/* Personal best notification */}
        {isPersonalBest && (
          <div className="bg-gradient-to-r from-yellow-100 to-yellow-200 border border-yellow-400 p-3 rounded-lg mb-4 animate-pulse">
            <div className="text-yellow-800 font-bold">🏆 NEW PERSONAL BEST!</div>
          </div>
        )}
        
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
