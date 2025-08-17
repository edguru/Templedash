import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { lightTheme } from "thirdweb/react";
import { createWallet, inAppWallet } from "thirdweb/wallets";
import { client, baseCampTestnet } from "../../lib/thirdweb";
import { ethereum } from "thirdweb/chains";
import { useEffect } from "react";
import { useGameState } from "../../lib/stores/useGameState";
import { useOnboarding } from "../../hooks/useOnboarding";

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

  // Auto-redirect based on onboarding status
  useEffect(() => {
    if (account) {
      console.log('User connected, checking onboarding status');
      if (!hasSeenOnboarding) {
        console.log('New user - directing to onboarding');
        setGamePhase('onboarding');
      } else {
        console.log('Returning user - directing to game');
        setGamePhase('main');
      }
    }
  }, [account, setGamePhase, hasSeenOnboarding]);

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

        <div className="text-gray-700 mb-8">
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
        
        <div className="mt-8 text-sm text-gray-500">
          <p>Secure connection • Base Camp testnet</p>
        </div>
      </div>
    </div>
  );
}