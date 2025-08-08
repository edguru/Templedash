import { useState } from "react";
import { useGameState } from "../../lib/stores/useGameState";
import { useNFT } from "../../lib/stores/useNFT";

interface CharacterOption {
  id: string;
  name: string;
  emoji: string;
  color: string;
  description: string;
  isOwned: boolean;
  isShadow?: boolean;
}

export default function CharacterSelectPopup() {
  const { setGamePhase, startGame } = useGameState();
  const { ownedCharacters, setCurrentCharacter } = useNFT();
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterOption | null>(null);

  // Available character types
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

  // Build character options including owned NFTs and shadow character
  const characterOptions: CharacterOption[] = [
    // Shadow character (always available)
    {
      id: 'shadow',
      name: 'Shadow Character',
      emoji: '👤',
      color: 'from-gray-500 to-gray-700',
      description: 'Default character for all players',
      isOwned: true,
      isShadow: true
    },
    // Add owned NFT characters
    ...ownedCharacters.map(owned => {
      const charInfo = availableCharacters.find(char => char.id === owned.characterType);
      return {
        id: owned.characterType,
        name: charInfo?.name || owned.name,
        emoji: charInfo?.emoji || '👤',
        color: charInfo?.color || 'from-gray-500 to-gray-700',
        description: charInfo?.description || 'NFT Character',
        isOwned: true
      };
    })
  ];

  const handleSelectCharacter = (character: CharacterOption) => {
    setSelectedCharacter(character);
  };

  const handleStartGame = () => {
    if (!selectedCharacter) return;

    // Set the current character
    if (selectedCharacter.isShadow) {
      setCurrentCharacter(null); // No NFT character selected
    } else {
      const nftCharacter = ownedCharacters.find(char => char.characterType === selectedCharacter.id);
      if (nftCharacter) {
        setCurrentCharacter(nftCharacter);
      }
    }

    // Start the game
    startGame();
  };

  const handleCancel = () => {
    setGamePhase('start');
  };

  return (
    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 text-center shadow-2xl">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Choose Your Character</h2>
        <p className="text-gray-600 mb-6 text-sm">
          Select a character to play with. NFT characters provide unique visual effects!
        </p>

        {/* Character Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {characterOptions.map((char) => (
            <div
              key={char.id}
              onClick={() => handleSelectCharacter(char)}
              className={`cursor-pointer p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                selectedCharacter?.id === char.id 
                  ? 'border-green-500 bg-green-50 shadow-lg' 
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
              }`}
            >
              {/* Character Avatar */}
              <div className={`w-16 h-16 mx-auto bg-gradient-to-b ${char.color} rounded-lg flex items-center justify-center mb-3 shadow-lg`}>
                <div className="text-2xl">{char.emoji}</div>
              </div>
              
              {/* Character Info */}
              <h3 className="font-semibold text-gray-800 text-sm mb-1">{char.name}</h3>
              <p className="text-xs text-gray-600 mb-2">{char.description}</p>
              
              {/* Status Badge */}
              {char.isShadow ? (
                <div className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                  Free
                </div>
              ) : (
                <div className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">
                  NFT Owned
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Selected Character Display */}
        {selectedCharacter && (
          <div className="bg-blue-50 p-3 rounded-lg mb-4">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Selected:</span> {selectedCharacter.name}
            </p>
            <p className="text-xs text-blue-600">{selectedCharacter.description}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={handleCancel}
            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-6 rounded-lg transition-colors"
          >
            Cancel
          </button>
          
          <button
            onClick={handleStartGame}
            disabled={!selectedCharacter}
            className={`flex-1 py-3 px-6 rounded-lg transition-colors font-bold ${
              selectedCharacter
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Play Game
          </button>
        </div>

        {/* Info Note */}
        <div className="mt-4 p-2 bg-yellow-50 rounded-lg">
          <p className="text-xs text-yellow-700">
            💡 NFT characters show unique colors and effects in-game while maintaining the same gameplay mechanics.
          </p>
        </div>
      </div>
    </div>
  );
}