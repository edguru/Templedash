import { useState } from 'react';
import { useGameState } from "../../lib/stores/useGameState";
import { useOnboarding } from "../../hooks/useOnboarding";

export default function OnboardingScreen() {
  const { setGamePhase } = useGameState();
  const { setHasSeenOnboarding } = useOnboarding();
  const [xFollowed, setXFollowed] = useState(false);
  const [telegramJoined, setTelegramJoined] = useState(false);

  const handleContinue = () => {
    if (xFollowed && telegramJoined) {
      setHasSeenOnboarding(true);
      setGamePhase('tutorial');
    }
  };

  const handleSkip = () => {
    setHasSeenOnboarding(true);
    setGamePhase('start');
  };

  return (
    <div className="absolute inset-0 bg-gradient-to-b from-purple-600 to-blue-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-auto text-center shadow-2xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome to Puppet Runner!</h1>
          <p className="text-gray-600 mb-4">Join our community to unlock the full experience</p>
        </div>

        {/* Community Steps */}
        <div className="space-y-4 mb-6">
          {/* X (Twitter) Follow */}
          <div className={`p-4 rounded-lg border-2 transition-all ${
            xFollowed ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="flex items-center justify-between">
              <div className="text-left">
                <h3 className="font-semibold text-gray-800">Follow on X</h3>
                <p className="text-sm text-gray-600">@ThePuppetsAI</p>
              </div>
              <div className="flex items-center space-x-2">
                {xFollowed ? (
                  <span className="text-green-500 text-xl">✅</span>
                ) : (
                  <>
                    <a
                      href="https://x.com/ThePuppetsAI"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-black text-white px-3 py-1 rounded text-sm hover:bg-gray-800 transition-colors"
                    >
                      Follow
                    </a>
                    <button
                      onClick={() => setXFollowed(true)}
                      className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors"
                    >
                      Done
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Telegram Join */}
          <div className={`p-4 rounded-lg border-2 transition-all ${
            telegramJoined ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="flex items-center justify-between">
              <div className="text-left">
                <h3 className="font-semibold text-gray-800">Join Telegram</h3>
                <p className="text-sm text-gray-600">Community Chat</p>
              </div>
              <div className="flex items-center space-x-2">
                {telegramJoined ? (
                  <span className="text-green-500 text-xl">✅</span>
                ) : (
                  <>
                    <a
                      href="https://t.me/+sZF2I7zAz601YTFl"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors"
                    >
                      Join
                    </a>
                    <button
                      onClick={() => setTelegramJoined(true)}
                      className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors"
                    >
                      Done
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-purple-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold text-purple-800 mb-2">Community Benefits:</h3>
          <ul className="text-sm text-purple-700 space-y-1">
            <li>🎮 Game updates and announcements</li>
            <li>🎁 Exclusive events and rewards</li>
            <li>💬 Chat with other players</li>
            <li>🚀 Early access to new features</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleContinue}
            disabled={!xFollowed || !telegramJoined}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            {xFollowed && telegramJoined ? 'Continue to Tutorial' : 'Complete Steps to Continue'}
          </button>
          
          <button
            onClick={handleSkip}
            className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 px-6 rounded-lg transition-colors text-sm"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}