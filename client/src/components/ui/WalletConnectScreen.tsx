import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { useAuth } from "../../lib/stores/useAuth";
import { useEffect, useState } from "react";
import { createThirdwebClient } from "thirdweb";
import { defineChain } from "thirdweb/chains";

const client = createThirdwebClient({
  clientId: process.env.REACT_APP_THIRDWEB_CLIENT_ID || "your-client-id",
});

export default function WalletConnectScreen() {
  const account = useActiveAccount();
  const { authenticateWallet, isAuthenticated } = useAuth();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleWalletAuth = async () => {
      if (account?.address && !isAuthenticated && !isAuthenticating) {
        setIsAuthenticating(true);
        setError(null);
        
        try {
          const success = await authenticateWallet(account.address);
          if (!success) {
            setError("Failed to authenticate wallet. Please try again.");
          }
        } catch (err) {
          setError("Wallet authentication failed. Please try again.");
          console.error("Auth error:", err);
        } finally {
          setIsAuthenticating(false);
        }
      }
    };

    handleWalletAuth();
  }, [account?.address, isAuthenticated, authenticateWallet, isAuthenticating]);

  return (
    <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-green-500 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Temple Runner</h1>
        <p className="text-gray-600 mb-8">NFT-Powered Infinite Runner</p>
        
        {/* Wallet Connection Status */}
        <div className="mb-8">
          {!account ? (
            <>
              <div className="text-gray-700 mb-6">
                <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
                <p className="text-sm">Connect your wallet to start playing and earning rewards!</p>
              </div>
              
              <ConnectButton
                client={client}
                theme="light"
                connectModal={{
                  size: "wide",
                  title: "Connect to Temple Runner",
                  showThirdwebBranding: false,
                }}
              />
            </>
          ) : isAuthenticating ? (
            <div className="py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Authenticating wallet...</p>
            </div>
          ) : error ? (
            <div className="bg-red-100 text-red-600 p-4 rounded-lg mb-4">
              <p>{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  if (account?.address) {
                    authenticateWallet(account.address);
                  }
                }}
                className="mt-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="bg-green-100 text-green-700 p-4 rounded-lg">
              <p className="font-semibold">Wallet Connected!</p>
              <p className="text-sm">{account.address?.slice(0, 6)}...{account.address?.slice(-4)}</p>
            </div>
          )}
        </div>

        {/* Game Features */}
        <div className="text-left bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-3">Game Features:</h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>🏃‍♂️ Infinite runner gameplay</li>
            <li>🎨 Mint unique NFT characters</li>
            <li>🎁 Mystery box token rewards</li>
            <li>🏆 Compete on leaderboards</li>
            <li>💎 Earn real crypto rewards</li>
          </ul>
        </div>
      </div>
    </div>
  );
}