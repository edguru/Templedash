import { useState } from "react";
import { useGameState } from "../../lib/stores/useGameState";
import { useNFT } from "../../lib/stores/useNFT";
import { useNFTService } from "../../lib/nftService";

const availableCharacters = [
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

export default function MintMoreScreen() {
  const [error, setError] = useState<string | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const { setGamePhase } = useGameState();
  const { ownedCharacters, addOwnedCharacter } = useNFT();
  const { mintNFT, isProcessing } = useNFTService();

  // Get characters user hasn't minted yet
  const ownedCharacterTypes = ownedCharacters.map(char => char.characterType);
  const availableToMint = availableCharacters.filter(char => 
    !ownedCharacterTypes.includes(char.id as any)
  );

  const handleMint = async (characterType: string) => {
    setError(null);
    setSelectedCharacter(characterType);

    try {
      const result = await mintNFT(characterType);
      
      if (result.success && result.tokenId) {
        const characterInfo = availableCharacters.find(char => char.id === characterType);
        
        if (characterInfo) {
          addOwnedCharacter({
            tokenId: result.tokenId,
            characterType: characterType as 'ninja_warrior' | 'space_ranger' | 'crystal_mage',
            name: characterInfo.name
          });
          
          console.log('✅ Additional NFT minted successfully:', result.tokenId);
          
          // Show success message briefly then return
          setTimeout(() => {
            setGamePhase('start');
          }, 2000);
        }
      }
    } catch (err) {
      console.error('Minting failed:', err);
      
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
      setSelectedCharacter(null);
    }
  };

  const handleBack = () => {
    setGamePhase('start');
  };

  if (availableToMint.length === 0) {
    return (
      <div className="absolute inset-0 bg-gradient-to-b from-purple-600 to-blue-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-auto text-center shadow-2xl">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-3">Collection Complete!</h1>
          <p className="text-gray-600 mb-6">
            You've minted all available character types! You now own all 3 unique characters in the game.
          </p>
          
          {/* Show owned characters */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {availableCharacters.map((char) => (
              <div key={char.id} className="p-3 rounded-lg bg-green-50 border-2 border-green-200">
                <div className={`w-12 h-12 mx-auto bg-gradient-to-b ${char.color} rounded-lg flex items-center justify-center mb-2 shadow-lg`}>
                  <div className="text-xl">{char.emoji}</div>
                </div>
                <p className="text-xs font-semibold text-green-700">{char.name}</p>
                <p className="text-xs text-green-600">✓ Owned</p>
              </div>
            ))}
          </div>
          
          <button
            onClick={handleBack}
            className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Back to Game
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-gradient-to-b from-purple-600 to-blue-600 flex items-start justify-center p-4 pt-8 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-auto text-center shadow-2xl mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-3">Mint More Characters</h1>
        <p className="text-gray-600 mb-4">
          Expand your collection! You can mint up to 3 total characters.
        </p>
        
        {/* Progress indicator */}
        <div className="bg-blue-50 p-3 rounded-lg mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-blue-700">Collection Progress</span>
            <span className="text-sm text-blue-600">{ownedCharacters.length}/3 Characters</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(ownedCharacters.length / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Available characters to mint */}
        <div className="space-y-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Available to Mint:</h3>
          
          {availableToMint.map((char) => (
            <div key={char.id} className="border-2 border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors">
              <div className="flex items-center space-x-4">
                <div className={`w-16 h-16 bg-gradient-to-b ${char.color} rounded-lg flex items-center justify-center shadow-lg flex-shrink-0`}>
                  <div className="text-2xl">{char.emoji}</div>
                </div>
                
                <div className="flex-1 text-left">
                  <h4 className="font-semibold text-gray-800">{char.name}</h4>
                  <p className="text-sm text-gray-600">{char.description}</p>
                  <p className="text-xs text-blue-600 mt-1">Cost: 0.001 CAMP</p>
                </div>
                
                <button
                  onClick={() => handleMint(char.id)}
                  disabled={isProcessing && selectedCharacter === char.id}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    isProcessing && selectedCharacter === char.id
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : 'bg-purple-500 hover:bg-purple-600 text-white'
                  }`}
                >
                  {isProcessing && selectedCharacter === char.id ? 'Minting...' : 'Mint'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Owned characters preview */}
        {ownedCharacters.length > 0 && (
          <div className="bg-green-50 p-3 rounded-lg mb-4">
            <h4 className="text-sm font-semibold text-green-700 mb-2">Your Characters:</h4>
            <div className="flex justify-center space-x-2">
              {ownedCharacters.map((owned) => {
                const charInfo = availableCharacters.find(char => char.id === owned.characterType);
                return charInfo ? (
                  <div key={owned.tokenId} className="text-center">
                    <div className={`w-8 h-8 bg-gradient-to-b ${charInfo.color} rounded flex items-center justify-center`}>
                      <div className="text-sm">{charInfo.emoji}</div>
                    </div>
                    <p className="text-xs text-green-600 mt-1">✓</p>
                  </div>
                ) : null;
              })}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Benefits reminder */}
        <div className="bg-blue-50 p-3 rounded-lg mb-4">
          <h4 className="font-semibold text-blue-800 mb-2 text-sm">Why Collect All Characters?</h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>🎮 Variety in gameplay experience</li>
            <li>💎 Complete your NFT collection</li>
            <li>🎨 Unique character appearances</li>
            <li>🏆 Show off your full collection</li>
          </ul>
        </div>

        <button
          onClick={handleBack}
          className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 px-6 rounded-lg transition-colors"
        >
          Back to Game
        </button>
      </div>
    </div>
  );
}