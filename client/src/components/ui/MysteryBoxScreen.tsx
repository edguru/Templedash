import { useState, useEffect } from "react";
import { useGameState } from "../../lib/stores/useGameState";
import { useRewards } from "../../lib/stores/useRewards";
import { useAudio } from "../../lib/stores/useAudio";
import { useAuth } from "../../lib/stores/useAuth";

interface Reward {
  amount: number;
  rarity: 'common' | 'rare' | 'legendary';
  color: string;
}

export default function MysteryBoxScreen() {
  const [isOpening, setIsOpening] = useState(false);
  const [reward, setReward] = useState<Reward | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { setGamePhase } = useGameState();
  const { openMysteryBox, addTokenReward } = useRewards();
  const { playSuccess } = useAudio();
  const { token } = useAuth();

  const generateReward = (): Reward => {
    const random = Math.random();
    
    if (random < 0.001) { // 0.1% chance
      return { amount: 10, rarity: 'legendary', color: 'text-purple-600' };
    } else if (random < 0.2) { // 19.9% chance  
      return { amount: 0.1, rarity: 'rare', color: 'text-blue-600' };
    } else { // 80% chance
      return { amount: 0.01, rarity: 'common', color: 'text-green-600' };
    }
  };

  const handleOpenBox = async () => {
    if (!token) {
      setError('Please log in to claim rewards');
      return;
    }

    setIsOpening(true);
    setError(null);
    
    try {
      // Generate reward
      const newReward = generateReward();
      
      // Claim reward through backend
      const response = await fetch('/api/tokens/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: newReward.amount,
          source: 'mystery_box'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to claim reward');
      }

      const claimData = await response.json();
      
      // Show reward after animation
      setTimeout(() => {
        setReward(newReward);
        openMysteryBox();
        addTokenReward(newReward.amount);
        playSuccess();
        setIsOpening(false);
      }, 2000);

    } catch (err) {
      console.error('Error claiming reward:', err);
      setError('Failed to claim reward. Please try again.');
      setIsOpening(false);
    }
  };

  const handleContinue = () => {
    setGamePhase('start');
  };

  const handlePlayAgain = () => {
    setGamePhase('playing');
  };

  return (
    <div className="absolute inset-0 bg-gradient-to-b from-purple-900 to-indigo-900 flex items-center justify-center">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center shadow-2xl">
        {!reward ? (
          <>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Mystery Box</h1>
            
            {/* Mystery box animation */}
            <div className="mb-6">
              <div className={`w-32 h-32 mx-auto bg-gradient-to-b from-purple-400 to-purple-600 rounded-lg flex items-center justify-center mb-4 shadow-lg ${isOpening ? 'animate-bounce' : ''}`}>
                <div className="text-4xl">
                  {isOpening ? "✨" : "🎁"}
                </div>
              </div>
              {isOpening && (
                <div className="text-purple-600 font-semibold animate-pulse">
                  Opening mystery box...
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            {/* Reward tiers */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6 text-sm">
              <h3 className="font-semibold mb-2">Possible Rewards:</h3>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-green-600">Common</span>
                  <span>$0.01 (80%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-600">Rare</span>
                  <span>$0.10 (19.9%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-600">Legendary</span>
                  <span>$10.00 (0.1%)</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleOpenBox}
              disabled={isOpening}
              className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              {isOpening ? "Opening..." : "🎁 OPEN MYSTERY BOX"}
            </button>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Congratulations!</h1>
            
            {/* Reward display */}
            <div className="mb-6">
              <div className="w-32 h-32 mx-auto bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center mb-4 shadow-lg animate-pulse">
                <div className="text-4xl">💰</div>
              </div>
              
              <div className={`text-3xl font-bold ${reward.color} mb-2`}>
                ${reward.amount}
              </div>
              
              <div className={`font-semibold ${reward.color} capitalize`}>
                {reward.rarity} Reward!
              </div>
              
              {reward.rarity === 'legendary' && (
                <div className="mt-2 text-purple-600 font-bold animate-bounce">
                  🎉 JACKPOT! 🎉
                </div>
              )}
            </div>

            {/* Continue buttons */}
            <div className="space-y-3">
              <button
                onClick={handlePlayAgain}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                PLAY AGAIN
              </button>
              
              <button
                onClick={handleContinue}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                MAIN MENU
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
