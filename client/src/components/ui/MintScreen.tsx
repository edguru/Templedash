import { useState } from "react";
// import { useAddress, useContract, useContractWrite } from "@thirdweb-dev/react";
import { useGameState } from "../../lib/stores/useGameState";
import { useNFT } from "../../lib/stores/useNFT";
// import { NFT_CONTRACT_ADDRESS } from "../../lib/thirdweb";

export default function MintScreen() {
  const [isMinting, setIsMinting] = useState(false);
  const { setGamePhase, startGame } = useGameState();
  const { setHasCharacterNFT } = useNFT();
  // const address = useAddress();
  const address = null; // Demo mode

  // const { contract } = useContract(NFT_CONTRACT_ADDRESS);
  // const { mutateAsync: mintNFT } = useContractWrite(contract, "mint");

  const handleMint = async () => {
    // Redirect to character preview instead of direct minting
    setGamePhase('characterPreview');
  };

  const handlePlayAsShadow = () => {
    startGame();
  };

  const handleBack = () => {
    setGamePhase('start');
  };

  return (
    <div className="absolute inset-0 bg-gradient-to-b from-purple-600 to-blue-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-auto text-center shadow-2xl">
        <h1 className="text-2xl font-bold text-gray-800 mb-3">Unlock Your Character</h1>
        
        {/* Character preview */}
        <div className="mb-4">
          <div className="w-24 h-24 mx-auto bg-gradient-to-b from-gray-400 to-gray-600 rounded-lg flex items-center justify-center mb-3 shadow-lg">
            <div className="text-3xl">👤</div>
          </div>
          <p className="text-gray-600 text-sm">Currently playing as Shadow Character</p>
        </div>

        {/* NFT Benefits */}
        <div className="bg-blue-50 p-3 rounded-lg mb-4">
          <h3 className="font-semibold text-blue-800 mb-2 text-sm">Character NFT Benefits:</h3>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>✨ Unlock full 3D character model</li>
            <li>🎮 Enhanced gameplay experience</li>
            <li>💎 Own your character forever</li>
            <li>🎁 Access to special rewards</li>
          </ul>
        </div>

        {/* Pricing */}
        <div className="bg-green-50 p-4 rounded-lg mb-6">
          <div className="text-2xl font-bold text-green-700">$2.00</div>
          <div className="text-sm text-green-600">One-time purchase</div>
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          <button
            onClick={handleMint}
            disabled={isMinting}
            className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
          >
            {isMinting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                Minting...
              </>
            ) : (
              "🚀 MINT CHARACTER NFT"
            )}
          </button>
          
          <button
            onClick={handlePlayAsShadow}
            className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            PLAY AS SHADOW CHARACTER
          </button>
          
          <button
            onClick={handleBack}
            className="w-full bg-white border-2 border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-3 px-6 rounded-lg transition-colors"
          >
            BACK
          </button>
        </div>

        <div className="mt-4 text-sm text-gray-500">
          Demo mode - Character unlock simulation
        </div>
      </div>
    </div>
  );
}
