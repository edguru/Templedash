import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { lightTheme } from "thirdweb/react";
import { createWallet, inAppWallet } from "thirdweb/wallets";
import { client, baseCampTestnet } from "../../lib/thirdweb";
import { ethereum } from "thirdweb/chains";
import { useEffect, useState } from "react";
import { useGameState } from "../../lib/stores/useGameState";
import { useOnboarding } from "../../hooks/useOnboarding";
import { sessionManager } from "../../lib/sessionSigners";
import { Key, Shield, Zap } from "lucide-react";

// Email and wallet-based authentication only
const wallets = [
  inAppWallet({
    auth: {
      options: ["email"], // Only email auth, no social logins
    },
  }),
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
  createWallet("me.rainbow"),
  createWallet("io.rabby"),
  createWallet("io.zerion.wallet"),
];

export default function WalletConnectScreen() {
  const account = useActiveAccount();
  const { setGamePhase } = useGameState();
  const { hasSeenOnboarding, setHasSeenOnboarding } = useOnboarding();
  const [isSettingUpSession, setIsSettingUpSession] = useState(false);

  // Auto-redirect and session setup after wallet connection
  useEffect(() => {
    if (account?.address && !isSettingUpSession) {
      console.log('User connected, setting up session and checking onboarding');
      setIsSettingUpSession(true);
      setupSessionAndRedirect();
    }
  }, [account, hasSeenOnboarding, isSettingUpSession]);

  const setupSessionAndRedirect = async () => {
    if (!account?.address) return;

    try {
      console.log('[WalletConnect] Setting up session signer for:', account.address);
      
      // Create session key for automated transactions
      const sessionData = await sessionManager.createSessionKey(account.address);
      await sessionManager.registerSessionWithBackend(account.address);
      
      console.log('[WalletConnect] Session key setup complete, redirecting...');
      
      // Redirect based on onboarding status
      if (!hasSeenOnboarding) {
        console.log('New user - directing to onboarding');
        setGamePhase('onboarding');
      } else {
        console.log('Returning user - directing to main app');
        setGamePhase('main');
      }
    } catch (error) {
      console.error('[WalletConnect] Error setting up session:', error);
      // Still redirect even if session setup fails
      setGamePhase(hasSeenOnboarding ? 'main' : 'onboarding');
    } finally {
      setIsSettingUpSession(false);
    }
  };

  return (
    <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
        <div className="mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl mx-auto mb-6 flex items-center justify-center">
            <span className="text-white font-bold text-xl">P</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Puppets AI</h1>
          <p className="text-gray-600 text-lg">Effortless Automation for Web3</p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 gap-4 mb-8">
          <div className="flex items-center space-x-3 text-left bg-gray-50 p-4 rounded-lg">
            <Key className="w-5 h-5 text-purple-600 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-medium text-gray-900">Automated Transactions</div>
              <div className="text-sm text-gray-600">AI executes blockchain tasks on your behalf</div>
            </div>
          </div>
          <div className="flex items-center space-x-3 text-left bg-gray-50 p-4 rounded-lg">
            <Shield className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-medium text-gray-900">Secure Sessions</div>
              <div className="text-sm text-gray-600">24-hour session keys for safe automation</div>
            </div>
          </div>
          <div className="flex items-center space-x-3 text-left bg-gray-50 p-4 rounded-lg">
            <Zap className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-medium text-gray-900">Base Camp Network</div>
              <div className="text-sm text-gray-600">Low-cost transactions with CAMP tokens</div>
            </div>
          </div>
        </div>

        {isSettingUpSession && account ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Setting up automated transaction session...</p>
          </div>
        ) : (
          <>
            <div className="text-gray-700 mb-6">
              Connect your wallet to start automating your Web3 tasks with AI assistance.
            </div>

            <ConnectButton
              client={client}
              wallets={wallets}
              connectModal={{ size: "wide" }}
              chain={baseCampTestnet}
              theme={lightTheme({
                colors: {
                  primaryButtonBg: "#6366f1",
                  primaryButtonText: "#ffffff",
                },
              })}
            />
            
            <div className="mt-6 text-sm text-gray-500">
              <p>Secure connection • Base Camp testnet</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}