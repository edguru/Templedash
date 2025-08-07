import { ConnectButton } from "thirdweb/react";
import { lightTheme } from "thirdweb/react";
import { createWallet } from "thirdweb/wallets";
import { client, baseCampTestnet } from "../../lib/thirdweb";

// Wallet configuration for Base Camp testnet
const wallets = [
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
  createWallet("me.rainbow"),
  createWallet("io.rabby"),
  createWallet("io.zerion.wallet"),
];

export default function WalletConnectScreen() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-green-500 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
        <div className="mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl">🎮</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Temple Runner</h1>
          <p className="text-gray-600">NFT-Powered Infinite Runner on Base Camp</p>
        </div>

        <div className="text-gray-700 mb-6">
          <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
          <p className="text-sm">Connect your wallet to start playing and earning PUPPETS rewards!</p>
        </div>

        {/* Thirdweb ConnectButton */}
        <div className="mb-6">
          <ConnectButton
            client={client}
            accountAbstraction={{
              chain: baseCampTestnet,
              sponsorGas: true,
            }}
            connectModal={{ 
              showThirdwebBranding: false, 
              size: "compact"
            }}
            theme={lightTheme({
              colors: {
                accentText: "hsl(258, 90%, 65%)", // Purple accent
                borderColor: "hsl(258, 90%, 65%)", // Purple border
                primaryButtonBg: "hsl(258, 90%, 65%)", // Purple button
                primaryButtonText: "hsl(0, 0%, 100%)", // White text
                connectedButtonBg: "hsl(142, 76%, 36%)", // Green when connected
                connectedButtonBgHover: "hsl(142, 76%, 30%)", // Darker green on hover
              },
            })}
            wallets={wallets}
            chain={baseCampTestnet}
            switchToActiveChain={true}
          />
        </div>

        {/* Environment variable warning */}
        {!import.meta.env.VITE_THIRDWEB_CLIENT_ID && (
          <div className="bg-yellow-100 text-yellow-800 p-3 rounded-lg text-sm">
            ⚠️ VITE_THIRDWEB_CLIENT_ID not configured. Please add your Thirdweb client ID.
          </div>
        )}

        <div className="mt-6 text-xs text-gray-500">
          <p>🌐 Base Camp Testnet by Camp Network</p>
          <p>💰 Earn $0.001-$10 PUPPETS tokens</p>
          <p>🐦 Share on X to tag @PuppetsAI</p>
        </div>
      </div>
    </div>
  );
}