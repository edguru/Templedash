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
    <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-green-500 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
        <div className="mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl">🎮</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Puppets AI</h1>
          <p className="text-gray-600">Puppet Runner - NFT-Powered Game</p>
          <p className="text-xs text-gray-500 mt-1">Uses CAMP for transactions</p>
        </div>

        <div className="text-gray-700 mb-6">
          <h2 className="text-xl font-semibold mb-2">Get Started</h2>
          <p className="text-sm mb-3">Connect with your wallet or sign up with email to start playing!</p>
          <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-700">
            <div className="font-medium mb-1">New to crypto?</div>
            <div>Choose "Continue with Email" for an easier start!</div>
          </div>
        </div>

        {/* Enhanced ConnectButton with email and wallet options */}
        <div className="mb-6">
          <ConnectButton
            client={client}
            chains={[baseCampTestnet, ethereum]}
            connectModal={{ 
              showThirdwebBranding: false, 
              size: "wide",
              privacyPolicyUrl: "https://thirdweb.com/privacy",
              termsOfServiceUrl: "https://thirdweb.com/tos",
              title: "Join Puppets AI",
              titleIcon: "🎮"
            }}
            switchButton={{
              label: "Switch to Base Camp Testnet",
              style: {
                background: "hsl(258, 90%, 65%)",
                color: "white",
                borderRadius: "8px",
                padding: "12px 24px",
                fontWeight: "600"
              }
            }}
            theme={lightTheme({
              colors: {
                accentText: "hsl(258, 90%, 65%)", 
                borderColor: "hsl(258, 90%, 65%)", 
                primaryButtonBg: "hsl(258, 90%, 65%)", 
                primaryButtonText: "hsl(0, 0%, 100%)", 
                connectedButtonBg: "hsl(142, 76%, 36%)", 
                connectedButtonBgHover: "hsl(142, 76%, 30%)", 
                modalBg: "hsl(0, 0%, 100%)",
                separatorLine: "hsl(0, 0%, 90%)",
                secondaryText: "hsl(0, 0%, 50%)",
              },
            })}
            wallets={wallets}
            connectButton={{
              label: "Connect & Play",
              style: {
                background: "hsl(258, 90%, 65%)",
                color: "white",
                borderRadius: "12px",
                padding: "16px 32px",
                fontSize: "16px",
                fontWeight: "600",
                width: "100%",
                border: "none",
                cursor: "pointer"
              }
            }}
          />
        </div>

        {/* Environment variable warning */}
        {!import.meta.env.VITE_THIRDWEB_CLIENT_ID && (
          <div className="bg-yellow-100 text-yellow-800 p-3 rounded-lg text-sm">
            ⚠️ VITE_THIRDWEB_CLIENT_ID not configured. Please add your Thirdweb client ID.
          </div>
        )}

        <div className="mt-6 space-y-3">
          <div className="text-xs text-gray-500">
            <p>🌐 Base Camp Testnet by Camp Network</p>
            <p>💰 Earn $0.001-$10 PUPPETS tokens</p>
            <p>🐦 Share on X to tag @thepuppetsai</p>
          </div>
          
          <div className="bg-green-50 p-3 rounded-lg text-xs text-green-700">
            <div className="font-medium mb-1">✅ Secure Authentication via Thirdweb:</div>
            <div>• Email: Easy signup, no crypto knowledge needed</div>
            <div>• Wallet: MetaMask, Coinbase, Rainbow, Rabby, Zerion</div>
          </div>
        </div>
      </div>
    </div>
  );
}