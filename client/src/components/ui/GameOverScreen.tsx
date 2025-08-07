import { useActiveAccount } from 'thirdweb/react';
import { useGameState } from "../../lib/stores/useGameState";
import { useRewards } from "../../lib/stores/useRewards";
import { useEffect, useState } from "react";

export default function GameOverScreen() {
  const account = useActiveAccount();
  const { score, distance, restartGame, setGamePhase } = useGameState();
  const { addCoins, addRun, canOpenMysteryBox } = useRewards();
  const [scoreSaved, setScoreSaved] = useState(false);
  const [isPersonalBest, setIsPersonalBest] = useState(false);
  const [userMysteryBoxStatus, setUserMysteryBoxStatus] = useState({ opened: 0, canOpenSecond: false });

  const coinsEarned = Math.floor(score / 10);

  // Save score when component mounts
  useEffect(() => {
    const saveScore = async () => {
      if (!account?.address || scoreSaved) return;
      
      try {
        const response = await fetch('/api/game/score', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer wallet_${account.address}`
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
  }, [account?.address, score, distance, coinsEarned, scoreSaved]);

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

  // Check mystery box eligibility on component mount
  useEffect(() => {
    const checkMysteryBoxStatus = async () => {
      if (!account?.address) return;
      
      try {
        const response = await fetch('/api/user/mystery-box-status', {
          headers: {
            'Authorization': `Bearer wallet_${account.address}`
          }
        });

        if (response.ok) {
          const status = await response.json();
          setUserMysteryBoxStatus(status);
        }
      } catch (error) {
        console.error('Failed to fetch mystery box status:', error);
      }
    };

    checkMysteryBoxStatus();
  }, [account?.address]);

  // Determine if user can open mystery box
  const canOpenBox = canOpenMysteryBox && (
    userMysteryBoxStatus.opened === 0 || 
    (userMysteryBoxStatus.opened === 1 && userMysteryBoxStatus.canOpenSecond)
  );

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-red-900/90 via-black/90 to-purple-900/90 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border-4 border-red-500 rounded-lg p-6 max-w-sm w-full mx-auto text-center shadow-2xl">
        {/* Pixel-style Game Over Title */}
        <div className="mb-4">
          <h1 
            className="text-3xl font-bold text-red-400 mb-2 tracking-wider"
            style={{ 
              fontFamily: 'Courier New, monospace',
              textShadow: '3px 3px 0px #8B0000, -1px -1px 0px #FF4444',
              imageRendering: 'pixelated'
            }}
          >
            GAME OVER
          </h1>
          <div className="w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>
        </div>
        
        {/* Personal best notification */}
        {isPersonalBest && (
          <div className="bg-gradient-to-r from-yellow-800 to-yellow-900 border-2 border-yellow-400 p-3 rounded mb-4 animate-pulse">
            <div className="text-yellow-300 font-bold" style={{ fontFamily: 'Courier New, monospace' }}>
              🏆 NEW PERSONAL BEST!
            </div>
          </div>
        )}
        
        {/* Stats with pixel styling - Compact */}
        <div className="space-y-2 mb-4 bg-black/70 p-3 rounded border-2 border-gray-700 text-sm">
          <div className="flex justify-between items-center">
            <span 
              className="text-cyan-400 font-bold"
              style={{ fontFamily: 'Courier New, monospace' }}
            >
              SCORE:
            </span>
            <span 
              className="text-white font-bold"
              style={{ fontFamily: 'Courier New, monospace' }}
            >
              {score.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span 
              className="text-green-400 font-bold"
              style={{ fontFamily: 'Courier New, monospace' }}
            >
              DISTANCE:
            </span>
            <span 
              className="text-white font-bold"
              style={{ fontFamily: 'Courier New, monospace' }}
            >
              {Math.floor(distance)}M
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span 
              className="text-yellow-400 font-bold"
              style={{ fontFamily: 'Courier New, monospace' }}
            >
              COINS:
            </span>
            <span 
              className="text-white font-bold"
              style={{ fontFamily: 'Courier New, monospace' }}
            >
              +{coinsEarned}
            </span>
          </div>
        </div>

        {/* Mystery box notification - Updated logic */}
        {canOpenBox && (
          <div className="bg-purple-800 border-2 border-purple-400 p-2 rounded mb-4 animate-pulse">
            <div className="text-purple-300 font-bold text-sm" style={{ fontFamily: 'Courier New, monospace' }}>
              🎁 MYSTERY BOX AVAILABLE!
            </div>
          </div>
        )}

        {/* Compact button layout */}
        <div className="space-y-3">
          {canOpenBox && (
            <button
              onClick={handleMysteryBox}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white px-4 py-3 border-2 border-purple-400 font-bold text-base transition-all transform hover:scale-105 hover:shadow-lg"
              style={{ 
                fontFamily: 'Courier New, monospace',
                textShadow: '2px 2px 0px #4A1A5C'
              }}
            >
              🎁 OPEN MYSTERY BOX
            </button>
          )}
          
          <button
            onClick={handleRestart}
            className="w-full bg-green-600 hover:bg-green-500 text-white px-4 py-3 border-2 border-green-400 font-bold text-base transition-all transform hover:scale-105 hover:shadow-lg"
            style={{ 
              fontFamily: 'Courier New, monospace',
              textShadow: '2px 2px 0px #2D5A27'
            }}
          >
            ► PLAY AGAIN
          </button>
          
          <button
            onClick={handleMainMenu}
            className="w-full bg-gray-600 hover:bg-gray-500 text-white px-4 py-3 border-2 border-gray-400 font-bold text-base transition-all transform hover:scale-105 hover:shadow-lg"
            style={{ 
              fontFamily: 'Courier New, monospace',
              textShadow: '2px 2px 0px #374151'
            }}
          >
            ◄ MAIN MENU
          </button>
        </div>
        
        {/* Pixel decoration */}
        <div className="mt-6 flex justify-center space-x-2">
          {Array.from({ length: 8 }, (_, i) => (
            <div 
              key={i}
              className={`w-2 h-2 ${i % 2 === 0 ? 'bg-red-500' : 'bg-gray-600'}`}
              style={{ imageRendering: 'pixelated' }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}
