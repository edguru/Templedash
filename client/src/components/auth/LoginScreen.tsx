import { useState } from "react";
import { useAuth } from "../../lib/stores/useAuth";
import { useGameState } from "../../lib/stores/useGameState";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function LoginScreen() {
  const [isConnecting, setIsConnecting] = useState(false);
  const { login, isLoading } = useAuth();
  const { setGamePhase } = useGameState();

  const handleWalletConnect = async (walletType: string) => {
    setIsConnecting(true);
    try {
      let walletAddress = '';
      
      if (walletType === "metamask" && window.ethereum) {
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        walletAddress = accounts[0];
      } else {
        // For demo/testing - generate a random wallet address
        walletAddress = "0x" + Math.random().toString(16).substring(2, 42).padStart(40, '0');
      }

      if (walletAddress) {
        await login(walletAddress);
        setGamePhase('start');
      }
    } catch (error) {
      console.error("Connection failed:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleGuestMode = () => {
    // For testing - create a demo wallet address
    const demoAddress = "0x" + Math.random().toString(16).substring(2, 42).padStart(40, '0');
    login(demoAddress, "Guest Player");
    setGamePhase('start');
  };

  return (
    <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-green-500 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Temple Runner</h1>
          <p className="text-gray-600 text-lg">NFT-Powered Infinite Runner</p>
          <div className="mt-4 flex justify-center">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
              Earn $0.01-$10 Rewards!
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* MetaMask Connection */}
          <button
            onClick={() => handleWalletConnect("metamask")}
            disabled={isConnecting || isLoading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConnecting ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Connecting...
              </div>
            ) : (
              <>
                <span className="mr-3">🦊</span>
                Connect with MetaMask
              </>
            )}
          </button>

          {/* WalletConnect */}
          <button
            onClick={() => handleWalletConnect("walletConnect")}
            disabled={isConnecting || isLoading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="mr-3">🔗</span>
            Connect with WalletConnect
          </button>

          {/* Email/Social Login */}
          <button
            onClick={() => handleWalletConnect("inApp")}
            disabled={isConnecting || isLoading}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="mr-3">📧</span>
            Continue with Email
          </button>

          {/* Guest Mode for Testing */}
          <div className="border-t pt-4 mt-6">
            <button
              onClick={handleGuestMode}
              disabled={isLoading}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Play as Guest (Demo Mode)
            </button>
            <p className="text-xs text-gray-500 mt-2">
              Guest mode for testing - no real rewards
            </p>
          </div>
        </div>

        <div className="mt-8 text-sm text-gray-600">
          <p>🎮 Play infinite runner gameplay</p>
          <p>🎯 Collect coins and unlock NFT characters</p>
          <p>💰 Earn real crypto rewards</p>
          <p>🏆 Compete on global leaderboards</p>
        </div>
      </div>
    </div>
  );
}