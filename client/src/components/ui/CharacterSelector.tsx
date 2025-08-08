import { useState } from 'react';
import { useNFT } from '../../lib/stores/useNFT';
import { useGameState } from '../../lib/stores/useGameState';

export default function CharacterSelector() {
  const { ownedCharacters, setSelectedCharacter, selectedCharacterTokenId } = useNFT();
  const { setGamePhase, startGame } = useGameState();

  // Character type to display info
  const getCharacterInfo = (characterType: string) => {
    const characterData = {
      'ninja_warrior': { name: 'Ninja Warrior', emoji: '🥷', color: 'from-red-500 to-red-700' },
      'space_ranger': { name: 'Space Ranger', emoji: '🚀', color: 'from-blue-500 to-blue-700' },
      'crystal_mage': { name: 'Crystal Mage', emoji: '🔮', color: 'from-purple-500 to-purple-700' },
      'shadow': { name: 'Shadow Character', emoji: '👤', color: 'from-gray-400 to-gray-600' }
    };
    return characterData[characterType as keyof typeof characterData] || characterData['shadow'];
  };

  const handleCharacterSelect = (tokenId: string) => {
    setSelectedCharacter(tokenId);
  };

  const handlePlaySelected = () => {
    startGame();
  };

  const handleMintMore = () => {
    setGamePhase('mint');
  };

  const handleBack = () => {
    setGamePhase('start');
  };

  if (ownedCharacters.length === 0) {
    return (
      <div className="absolute inset-0 bg-gradient-to-b from-purple-600 to-blue-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-auto text-center shadow-2xl">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">No Characters Owned</h1>
          <p className="text-gray-600 mb-6">You don't own any character NFTs yet. Each NFT is a unique character!</p>
          
          <div className="space-y-3">
            <button
              onClick={handleMintMore}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              🚀 MINT CHARACTER NFT
            </button>
            
            <button
              onClick={handleBack}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              BACK TO MENU
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-gradient-to-b from-purple-600 to-blue-600 flex items-start justify-center p-4 pt-8 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-auto text-center shadow-2xl mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-3">Select Your Character</h1>
        <p className="text-gray-600 mb-4">Choose which character NFT to play with</p>
        
        {/* Character Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {ownedCharacters.map((character) => {
            const info = getCharacterInfo(character.characterType);
            const isSelected = character.tokenId === selectedCharacterTokenId;
            
            return (
              <div
                key={character.tokenId}
                onClick={() => handleCharacterSelect(character.tokenId)}
                className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                  isSelected 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`w-20 h-20 mx-auto bg-gradient-to-b ${info.color} rounded-lg flex items-center justify-center mb-3 shadow-lg`}>
                  <div className="text-3xl">{info.emoji}</div>
                </div>
                <p className="text-sm font-semibold text-gray-700">{character.name}</p>
                <p className="text-xs text-gray-500">Token #{character.tokenId}</p>
                {isSelected && (
                  <div className="mt-2">
                    <span className="inline-block bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                      Selected
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Selected Character Info */}
        {selectedCharacterTokenId && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              Ready to play with: <span className="font-semibold">
                {ownedCharacters.find(char => char.tokenId === selectedCharacterTokenId)?.name}
              </span>
            </p>
          </div>
        )}
        
        {/* Action buttons */}
        <div className="space-y-3">
          <button
            onClick={handlePlaySelected}
            disabled={!selectedCharacterTokenId}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            🎮 PLAY SELECTED CHARACTER
          </button>
          
          <button
            onClick={handleMintMore}
            className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            🚀 MINT MORE CHARACTERS
          </button>
          
          <button
            onClick={handleBack}
            className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            BACK TO MENU
          </button>
        </div>
      </div>
    </div>
  );
}