import React, { useState } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { MessageCircle, Zap, Gamepad2, User, Menu, X } from 'lucide-react';
import ChatThreads from './ChatThreads';
import MiniGamesScreen from './MiniGamesScreen';
import AccountScreen from './AccountScreen';
import OnboardingHelpButton from './OnboardingHelpButton';

type TabType = 'chat' | 'minigames' | 'account';

const MainApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [showMenu, setShowMenu] = useState(false);
  const account = useActiveAccount();
  const address = account?.address;

  const tabs = [
    { id: 'chat' as TabType, name: 'Chat', icon: MessageCircle, color: 'text-purple-600' },
    { id: 'minigames' as TabType, name: 'Mini Games', icon: Gamepad2, color: 'text-green-600' },
    { id: 'account' as TabType, name: 'Account', icon: User, color: 'text-indigo-600' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'chat':
        return <ChatThreads />;
      case 'minigames':
        return <MiniGamesScreen />;
      case 'account':
        return <AccountScreen />;
      default:
        return <ChatThreads />;
    }
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Puppets AI</h1>
            <p className="text-xs text-gray-500">Effortless Automation for Web3</p>
          </div>
        </div>
        
        {/* Mobile menu button */}
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100"
        >
          {showMenu ? <X size={20} /> : <Menu size={20} />}
        </button>
        
        {/* Desktop wallet status and help */}
        <div className="hidden md:flex items-center space-x-4">
          <OnboardingHelpButton />
          {address ? (
            <div className="flex items-center space-x-2 bg-green-50 px-3 py-1 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-green-700 font-medium">
                {address.slice(0, 6)}...{address.slice(-4)}
              </span>
            </div>
          ) : (
            <div className="text-sm text-gray-500">Not connected</div>
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Mobile menu overlay */}
        {showMenu && (
          <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowMenu(false)}>
            <div className="bg-white w-64 h-full shadow-lg p-4" onClick={e => e.stopPropagation()}>
              <div className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setShowMenu(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon size={20} className={activeTab === tab.id ? tab.color : ''} />
                      <span className="font-medium">{tab.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-64 bg-white border-r flex-col">
          <nav className="flex-1 p-4">
            <div className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={20} className={activeTab === tab.id ? tab.color : ''} />
                    <span className="font-medium">{tab.name}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          {renderContent()}
        </main>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
          <div className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex flex-col items-center py-2 px-1 ${
                    activeTab === tab.id ? tab.color : 'text-gray-400'
                  }`}
                >
                  <Icon size={20} />
                  <span className="text-xs mt-1">{tab.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainApp;