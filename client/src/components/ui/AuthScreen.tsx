import React, { useState, useEffect } from 'react';
import { ConnectButton, useActiveAccount } from 'thirdweb/react';
import { client } from '../../lib/thirdweb';
import { createWallet, inAppWallet } from 'thirdweb/wallets';
import { Twitter, MessageCircle, CheckCircle, User, Mail } from 'lucide-react';

interface OnboardingTask {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  completed: boolean;
  url?: string;
}

interface AuthScreenProps {
  onAuthComplete: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthComplete }) => {
  const account = useActiveAccount();
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [onboardingTasks, setOnboardingTasks] = useState<OnboardingTask[]>([
    {
      id: 'follow-twitter',
      title: 'Follow @PuppetsAI on X',
      description: 'Stay updated with the latest news and features',
      icon: Twitter,
      completed: false,
      url: 'https://x.com/PuppetsAI'
    },
    {
      id: 'join-telegram',
      title: 'Join Telegram Community',
      description: 'Connect with other users and get support',
      icon: MessageCircle,
      completed: false,
      url: 'https://t.me/PuppetsAI'
    }
  ]);

  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    if (account?.address) {
      checkUserStatus(account.address);
    }
  }, [account]);

  const checkUserStatus = async (address: string) => {
    try {
      const response = await fetch(`/api/user/status?address=${address}`);
      const data = await response.json();
      
      if (data.isNewUser) {
        setIsNewUser(true);
      } else {
        // Existing user, complete onboarding
        onAuthComplete();
      }
    } catch (error) {
      console.error('Error checking user status:', error);
      // Assume new user on error
      setIsNewUser(true);
    }
  };

  const completeOnboardingTask = (taskId: string) => {
    setOnboardingTasks(prev => 
      prev.map(task => 
        task.id === taskId ? { ...task, completed: true } : task
      )
    );

    // If all tasks completed, finish onboarding
    const updatedTasks = onboardingTasks.map(task => 
      task.id === taskId ? { ...task, completed: true } : task
    );
    
    if (updatedTasks.every(task => task.completed)) {
      setTimeout(() => {
        markOnboardingComplete();
      }, 1000);
    }
  };

  const markOnboardingComplete = async () => {
    if (account?.address) {
      try {
        await fetch('/api/user/complete-onboarding', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            address: account.address
          })
        });
        onAuthComplete();
      } catch (error) {
        console.error('Error completing onboarding:', error);
        // Complete anyway on error
        onAuthComplete();
      }
    }
  };

  const wallets = [
    createWallet('io.metamask'),
    createWallet('com.coinbase.wallet'),
    createWallet('me.rainbow'),
    createWallet('io.rabby'),
    createWallet('io.zerion.wallet'),
    inAppWallet({
      auth: {
        options: ['email', 'phone']
      }
    })
  ];

  if (account?.address && !isNewUser) {
    onAuthComplete();
    return null;
  }

  if (account?.address && isNewUser) {
    const allCompleted = onboardingTasks.every(task => task.completed);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <User size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Puppets AI!</h1>
            <p className="text-gray-600">Complete these tasks to get started</p>
          </div>

          <div className="space-y-4 mb-8">
            {onboardingTasks.map((task) => (
              <div 
                key={task.id}
                className={`p-4 rounded-xl border-2 transition-all ${
                  task.completed 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-gray-200 hover:border-purple-200 hover:bg-purple-50 cursor-pointer'
                }`}
                onClick={() => {
                  if (!task.completed && task.url) {
                    window.open(task.url, '_blank');
                    setTimeout(() => completeOnboardingTask(task.id), 2000);
                  }
                }}
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-full ${
                    task.completed ? 'bg-green-100' : 'bg-purple-100'
                  }`}>
                    {task.completed ? (
                      <CheckCircle size={24} className="text-green-600" />
                    ) : (
                      <task.icon size={24} className="text-purple-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{task.title}</h3>
                    <p className="text-sm text-gray-600">{task.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {allCompleted && (
            <div className="text-center">
              <div className="animate-pulse">
                <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
                <p className="text-green-600 font-semibold">Completing setup...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!showAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-white font-bold text-3xl">P</span>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Puppets AI</h1>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Your AI-powered companion for Web3 automation and blockchain task execution
          </p>

          <button
            onClick={() => {
              setShowAuth(true);
              setAuthMode('signup');
            }}
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold py-4 px-6 rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all mb-4"
          >
            Get Started
          </button>

          <button
            onClick={() => {
              setShowAuth(true);
              setAuthMode('login');
            }}
            className="w-full text-purple-600 font-medium py-3 px-6 rounded-xl hover:bg-purple-50 transition-all"
          >
            Already have an account? Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">P</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {authMode === 'signup' ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-gray-600">
            {authMode === 'signup' 
              ? 'Connect your wallet to get started' 
              : 'Connect your wallet to continue'
            }
          </p>
        </div>

        <div className="space-y-4">
          <ConnectButton
            client={client}
            wallets={wallets}
            theme="light"
            connectButton={{
              label: authMode === 'signup' ? "Connect Wallet" : "Sign In"
            }}
            switchButton={{
              label: "Switch Wallet"
            }}
          />
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
            className="text-purple-600 hover:text-purple-800 font-medium"
          >
            {authMode === 'login' 
              ? "Don't have an account? Sign Up" 
              : "Already have an account? Sign In"
            }
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-500">
            By connecting, you agree to our terms and privacy policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;