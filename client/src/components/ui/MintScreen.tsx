import { useState } from "react";
import { useGameState } from "../../lib/stores/useGameState";
import { useNFT } from "../../lib/stores/useNFT";
import { useNFTService } from "../../lib/nftService";
import { MYSTERY_BOX_CONFIG } from "../../lib/thirdweb";

export default function MintScreen() {
  const [isMinting, setIsMinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setGamePhase, startGame } = useGameState();
  const { addOwnedCharacter } = useNFT();
  const { mintNFT, userAddress, isProcessing } = useNFTService();

  const handleMint = async (characterType: string = 'shadow_stick_human') => {
    if (!userAddress) {
      setError('Please connect your wallet to mint an NFT');
      return;
    }

    setIsMinting(true);
    setError(null);

    try {
      const result = await mintNFT(characterType) as { success: boolean; tokenId?: string; transactionHash?: string };
      
      if (result.success && result.tokenId) {
        // Find character info  
        const characterInfo = characters.find(char => char.id === characterType) || characters[0];
        
        // Add to owned characters
        addOwnedCharacter({
          tokenId: result.tokenId,
          characterType: characterType as 'ninja_warrior' | 'space_ranger' | 'crystal_mage',
          name: characterInfo.name
        });
        
        console.log('✅ NFT minted successfully with token ID:', result.tokenId);
        setGamePhase('characterPreview');
      }
    } catch (err) {
      console.error('Minting failed:', err);
      
      // Detailed error handling
      let errorMessage = 'Failed to mint NFT';
      if (err instanceof Error) {
        if (err.message.includes('execution reverted')) {
          errorMessage = 'Transaction failed. Make sure you have at least 0.001 CAMP for the mint fee.';
        } else if (err.message.includes('User rejected')) {
          errorMessage = 'Transaction was cancelled by user.';
        } else {
          errorMessage = `Minting error: ${err.message}`;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsMinting(false);
    }
  };

  const handlePlayAsShadow = () => {
    startGame();
  };

  const handleBack = () => {
    setGamePhase('start');
  };

  // Define available characters
  const characters = [
    {
      id: 'ninja_warrior',
      name: 'Ninja Warrior',
      emoji: '🥷',
      color: 'from-red-500 to-red-700',
      description: 'Swift and agile fighter'
    },
    {
      id: 'space_ranger',
      name: 'Space Ranger', 
      emoji: '🚀',
      color: 'from-blue-500 to-blue-700',
      description: 'Galactic explorer'
    },
    {
      id: 'crystal_mage',
      name: 'Crystal Mage',
      emoji: '🔮',
      color: 'from-purple-500 to-purple-700', 
      description: 'Master of magic arts'
    }
  ];

  const [selectedCharacter, setSelectedCharacter] = useState(characters[0]);

  const handleMintSelected = async () => {
    await handleMint(selectedCharacter.id);
  };

  return (
    <div className="absolute inset-0 bg-gradient-to-b from-purple-600 to-blue-600 flex items-start justify-center p-4 pt-8 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-auto text-center shadow-2xl mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-3">Mint Character NFT</h1>
        <p className="text-gray-600 mb-4">Each NFT is a unique character. You can mint multiple characters!</p>
        
        {/* Character Selection */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {characters.map((char) => (
            <div
              key={char.id}
              onClick={() => setSelectedCharacter(char)}
              className={`cursor-pointer p-3 rounded-lg border-2 transition-all ${
                selectedCharacter.id === char.id 
                  ? 'border-purple-500 bg-purple-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`w-16 h-16 mx-auto bg-gradient-to-b ${char.color} rounded-lg flex items-center justify-center mb-2 shadow-lg`}>
                <div className="text-2xl">{char.emoji}</div>
              </div>
              <p className="text-xs font-semibold text-gray-700">{char.name}</p>
              <p className="text-xs text-gray-500">{char.description}</p>
            </div>
          ))}
        </div>

        {/* Selected Character Info */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Selected: <span className="font-semibold">{selectedCharacter.name}</span></p>
          <p className="text-xs text-gray-500">{selectedCharacter.description}</p>
        </div>

        {/* NFT Benefits */}
        <div className="bg-blue-50 p-3 rounded-lg mb-4">
          <h3 className="font-semibold text-blue-800 mb-2 text-sm">Character NFT Benefits:</h3>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>✨ Each NFT = One unique character</li>
            <li>🎮 Enhanced gameplay experience</li>
            <li>💎 Own your characters forever</li>
            <li>🎁 Mint multiple for variety</li>
          </ul>
        </div>

        {/* Network Info */}
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <div className="text-sm font-semibold text-blue-700">Base Camp Testnet</div>
          <div className="text-xs text-blue-600">Powered by Camp Network</div>
          <div className="text-xs text-blue-500 mt-1">Mint Fee: 0.001 CAMP</div>
        </div>

        {error && (
          <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Action buttons */}
        <div className="space-y-3">
          <button
            onClick={handleMintSelected}
            disabled={isMinting || isProcessing || !userAddress}
            className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
          >
            {isMinting || isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                Minting...
              </>
            ) : !userAddress ? (
              "Connect Wallet to Mint"
            ) : (
              `🚀 MINT ${selectedCharacter.name.toUpperCase()}`
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
          Contract deployed at: 0x00005A2F0e8F4303F719A9f45F25cA578F4AA500
        </div>
      </div>
    </div>
  );
}
