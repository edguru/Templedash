import { useState } from 'react';
import { useNFT } from '../../lib/stores/useNFT';
import { useGameState } from '../../lib/stores/useGameState';
import { nftService } from '../../lib/nftService';

// Available characters for minting
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

export default function CharacterPreview() {
  const [selectedCharacter, setSelectedCharacter] = useState(characters[0]);
  const [isMinting, setIsMinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addOwnedCharacter } = useNFT();
  const { setGamePhase } = useGameState();

  const handleMint = async () => {
    setIsMinting(true);
    setError(null);
    
    try {
      const result = await nftService.mintCharacter(selectedCharacter.id);
      
      if (result.success && result.tokenId) {
        // Add to owned characters
        addOwnedCharacter({
          tokenId: result.tokenId,
          characterType: selectedCharacter.id as 'ninja_warrior' | 'space_ranger' | 'crystal_mage',
          name: selectedCharacter.name
        });
        
        console.log('✅ NFT minted successfully with token ID:', result.tokenId);
        setGamePhase('start');
      }
    } catch (err) {
      console.error('Minting failed:', err);
      
      let errorMessage = 'Minting failed. Please try again.';
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

  const handleBack = () => {
    setGamePhase('mint');
  };

  return (
    <div className="absolute inset-0 bg-gradient-to-b from-purple-600 to-blue-600 flex items-start justify-center p-4 pt-8 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-auto text-center shadow-2xl mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-3">Preview & Mint Character</h1>
        <p className="text-gray-600 mb-4">Your new character is ready to mint!</p>
        
        {/* Character Preview */}
        <div className="mb-6">
          <div className={`w-32 h-32 mx-auto bg-gradient-to-b ${selectedCharacter.color} rounded-lg flex items-center justify-center mb-4 shadow-lg`}>
            <div className="text-6xl">{selectedCharacter.emoji}</div>
          </div>
          <h2 className="text-xl font-bold text-gray-800">{selectedCharacter.name}</h2>
          <p className="text-gray-600">{selectedCharacter.description}</p>
        </div>

        {/* Character Selection */}
        <div className="grid grid-cols-3 gap-3 mb-6">
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
              <div className={`w-12 h-12 mx-auto bg-gradient-to-b ${char.color} rounded-lg flex items-center justify-center mb-2 shadow-lg`}>
                <div className="text-xl">{char.emoji}</div>
              </div>
              <p className="text-xs font-semibold text-gray-700">{char.name}</p>
            </div>
          ))}
        </div>

        {/* Character Benefits */}
        <div className="bg-blue-50 p-3 rounded-lg mb-4">
          <h3 className="font-semibold text-blue-800 mb-2 text-sm">Character NFT Benefits:</h3>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>✨ Unique character appearance</li>
            <li>🎮 Enhanced gameplay experience</li>
            <li>💎 Own your character forever</li>
            <li>🎁 Special visual effects</li>
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

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleMint}
            disabled={isMinting}
            className={`w-full py-3 rounded-lg font-semibold transition-colors ${
              isMinting
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white'
            }`}
          >
            {isMinting ? 'Minting Character NFT...' : `Mint ${selectedCharacter.name} NFT`}
          </button>
          
          <button
            onClick={handleBack}
            className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 px-6 rounded-lg transition-colors"
          >
            Back to Selection
          </button>
        </div>
      </div>
    </div>
  );
}