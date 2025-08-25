import React, { useState } from 'react';
import { Twitter, Users, ExternalLink, CheckCircle, ArrowRight } from 'lucide-react';
import { useCompanionOnboarding } from '../../hooks/useCompanionOnboarding';

interface SocialTasksScreenProps {
  onTasksCompleted: () => void;
}

const SocialTasksScreen: React.FC<SocialTasksScreenProps> = ({ onTasksCompleted }) => {
  const { 
    hasFollowedTwitter, 
    hasJoinedTelegram, 
    markTwitterCompleted, 
    markTelegramCompleted 
  } = useCompanionOnboarding();

  const [twitterClicked, setTwitterClicked] = useState(hasFollowedTwitter);
  const [telegramClicked, setTelegramClicked] = useState(hasJoinedTelegram);

  const handleTwitterClick = () => {
    setTwitterClicked(true);
    markTwitterCompleted();
  };

  const handleTelegramClick = () => {
    setTelegramClicked(true);
    markTelegramCompleted();
  };

  const canProceed = twitterClicked && telegramClicked;

  return (
    <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50"
         style={{ 
           minHeight: '100vh',
           touchAction: 'auto',
           WebkitOverflowScrolling: 'touch',
           overflow: 'auto'
         }}>
      
      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="text-white" size={40} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3">
            Join Our Community
          </h1>
          <p className="text-gray-600 text-base sm:text-lg">
            Complete these steps to unlock your AI companion creation
          </p>
        </div>

        {/* Tasks */}
        <div className="space-y-6 mb-8">
          {/* Twitter Task */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-start space-x-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                twitterClicked ? 'bg-green-100' : 'bg-blue-100'
              }`}>
                {twitterClicked ? (
                  <CheckCircle className="text-green-600" size={24} />
                ) : (
                  <Twitter className="text-blue-500" size={24} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Follow Us on X (Twitter)
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Stay updated with the latest features, announcements, and community highlights.
                </p>
                <a
                  href={process.env.TWITTER_URL || "https://twitter.com/puppet_runner"}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleTwitterClick}
                  className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    twitterClicked
                      ? 'bg-green-100 text-green-700 cursor-default'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  <Twitter size={16} />
                  <span>{twitterClicked ? 'Followed!' : 'Follow @puppet_runner'}</span>
                  {!twitterClicked && <ExternalLink size={14} />}
                </a>
              </div>
            </div>
          </div>

          {/* Telegram Task */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-start space-x-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                telegramClicked ? 'bg-green-100' : 'bg-purple-100'
              }`}>
                {telegramClicked ? (
                  <CheckCircle className="text-green-600" size={24} />
                ) : (
                  <Users className="text-purple-500" size={24} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Join Our Telegram Community
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Connect with other users, get support, and participate in exclusive community events.
                </p>
                <a
                  href={process.env.TELEGRAM_URL || "https://t.me/puppet_runner"}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleTelegramClick}
                  className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    telegramClicked
                      ? 'bg-green-100 text-green-700 cursor-default'
                      : 'bg-purple-500 text-white hover:bg-purple-600'
                  }`}
                >
                  <Users size={16} />
                  <span>{telegramClicked ? 'Joined!' : 'Join Telegram'}</span>
                  {!telegramClicked && <ExternalLink size={14} />}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <div className="text-center">
          <button
            onClick={onTasksCompleted}
            disabled={!canProceed}
            className={`w-full sm:w-auto px-8 py-3 rounded-lg font-medium flex items-center justify-center space-x-2 transition-all ${
              canProceed
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <span>Continue to Companion Creation</span>
            <ArrowRight size={18} />
          </button>
          
          {!canProceed && (
            <p className="text-sm text-gray-500 mt-3">
              Complete both tasks above to continue
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SocialTasksScreen;