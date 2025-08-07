import { useState, useEffect } from "react";
import { useActiveAccount } from 'thirdweb/react';
import { useGameState } from "../../lib/stores/useGameState";
import { useRewards } from "../../lib/stores/useRewards";
import { useAudio } from "../../lib/stores/useAudio";
import { useNFTService, MysteryBoxReward } from "../../lib/nftService";
import { MYSTERY_BOX_CONFIG } from "../../lib/thirdweb";

interface Reward extends MysteryBoxReward {
  rarity: 'common' | 'rare' | 'legendary';
  color: string;
}

export default function MysteryBoxScreen() {
  const [isOpening, setIsOpening] = useState(false);
  const [reward, setReward] = useState<Reward | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [canClaim, setCanClaim] = useState(true);
  const account = useActiveAccount();
  const { setGamePhase } = useGameState();
  const { openMysteryBox, addTokenReward } = useRewards();
  const { playSuccess } = useAudio();
  const { openMysteryBox: openBox, shareOnX, userAddress } = useNFTService();

  // Check if user can claim mystery box
  useEffect(() => {
    if (userAddress) {
      const hasClaimedBox = localStorage.getItem(`mysteryBox_${userAddress}`);
      setCanClaim(!hasClaimedBox);
    }
  }, [userAddress]);

  const convertRewardToDisplay = (boxReward: MysteryBoxReward): Reward => {
    const isJackpot = boxReward.type === 'jackpot';
    return {
      ...boxReward,
      rarity: isJackpot ? 'legendary' : 'common',
      color: isJackpot ? 'text-purple-600' : 'text-green-600',
    };
  };

  const handleOpenBox = async () => {
    if (!userAddress) {
      setError('Please connect your wallet to claim rewards');
      return;
    }

    if (!canClaim) {
      setError('You can only claim one mystery box per wallet');
      return;
    }

    setIsOpening(true);
    setError(null);
    
    try {
      // Open mystery box using Thirdweb service
      const boxReward = await openBox();
      const displayReward = convertRewardToDisplay(boxReward);
      
      // Claim reward through backend if available
      if (account?.address) {
        try {
          const response = await fetch('/api/tokens/claim', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer wallet_${account.address}`
            },
            body: JSON.stringify({
              amount: boxReward.amount,
              source: 'mystery_box',
              currency: boxReward.currency,
              walletAddress: userAddress
            })
          });
          
          if (response.ok) {
            const claimData = await response.json();
            console.log('Reward claimed:', claimData);
          }
        } catch (backendError) {
          console.warn('Backend reward claim failed:', backendError);
          // Continue anyway - local storage tracking is still valid
        }
      }
      
      // Show reward after animation
      setTimeout(() => {
        setReward(displayReward);
        openMysteryBox();
        addTokenReward(boxReward.amount);
        playSuccess();
        setIsOpening(false);
        setCanClaim(false);
      }, 2000);

    } catch (err) {
      console.error('Error opening mystery box:', err);
      setError(typeof err === 'string' ? err : 'Failed to open mystery box. Please try again.');
      setIsOpening(false);
    }
  };

  const handleShareOnX = () => {
    if (reward) {
      shareOnX(reward);
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
              <h3 className="font-semibold mb-2">Puppets AI Token Rewards:</h3>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-green-600">Standard</span>
                  <span>${MYSTERY_BOX_CONFIG.PUPPETS_TOKEN_REWARD} PUPPETS</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-600">Jackpot</span>
                  <span>${MYSTERY_BOX_CONFIG.JACKPOT_REWARD} PUPPETS (1 in {MYSTERY_BOX_CONFIG.JACKPOT_ODDS})</span>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Only {MYSTERY_BOX_CONFIG.MAX_BOXES_PER_USER} mystery box per wallet
              </div>
            </div>

            <button
              onClick={handleOpenBox}
              disabled={isOpening || !canClaim}
              className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              {isOpening ? "Opening..." : !canClaim ? "Already Claimed" : "🎁 OPEN MYSTERY BOX"}
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
                ${reward.amount} {reward.currency}
              </div>
              
              <div className={`font-semibold ${reward.color} capitalize`}>
                {reward.rarity} Reward!
              </div>
              
              <div className="text-sm text-gray-600 mt-2">
                {reward.type === 'jackpot' ? '🎉 JACKPOT! You won the big prize!' : '🎯 Standard Puppets AI token reward'}
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
                onClick={handleShareOnX}
                className="w-full bg-black hover:bg-gray-800 text-white font-bold py-2 px-4 rounded transition-colors flex items-center justify-center gap-2"
              >
                🐦 Share on X (Twitter)
              </button>
              
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
