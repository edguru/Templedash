import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useAuth } from "../../lib/stores/useAuth";
import { useEffect, useState } from "react";

export default function WalletConnectScreen() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const { authenticateWallet, isAuthenticated } = useAuth();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleWalletAuth = async () => {
      if (authenticated && user?.wallet?.address && !isAuthenticated && !isAuthenticating) {
        setIsAuthenticating(true);
        setError(null);
        
        try {
          const success = await authenticateWallet(user.wallet.address);
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

    if (ready) {
      handleWalletAuth();
    }
  }, [authenticated, user?.wallet?.address, isAuthenticated, authenticateWallet, isAuthenticating, ready]);

  return (
    <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-green-500 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Temple Runner</h1>
        <p className="text-gray-600 mb-8">NFT-Powered Infinite Runner</p>
        
        {/* Wallet Connection Status */}
        <div className="mb-8">
          {!authenticated ? (
            <>
              <div className="text-gray-700 mb-6">
                <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
                <p className="text-sm">Connect your wallet to start playing and earning rewards!</p>
              </div>
              
              <button
                onClick={login}
                disabled={!ready}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors disabled:opacity-50"
              >
                {ready ? 'Connect Wallet' : 'Loading...'}
              </button>
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
                  if (user?.wallet?.address) {
                    authenticateWallet(user.wallet.address);
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
              <p className="text-sm">{user?.wallet?.address?.slice(0, 6)}...{user?.wallet?.address?.slice(-4)}</p>
              <button
                onClick={logout}
                className="mt-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors text-sm"
              >
                Disconnect
              </button>
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