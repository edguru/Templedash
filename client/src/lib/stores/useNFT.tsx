import { create } from "zustand";
import { persist } from "zustand/middleware";

type CharacterType = 'shadow' | 'ninja_warrior' | 'space_ranger' | 'crystal_mage';

interface OwnedCharacter {
  tokenId: string;
  characterType: CharacterType;
  name: string;
}

interface NFTState {
  hasCharacterNFT: boolean;
  ownedCharacters: OwnedCharacter[];
  selectedCharacterTokenId: string | null;
  currentCharacterType: CharacterType;
  currentCharacter: OwnedCharacter | null;
  
  // Actions
  setHasCharacterNFT: (hasNFT: boolean) => void;
  addOwnedCharacter: (character: OwnedCharacter) => void;
  setSelectedCharacter: (tokenId: string) => void;
  setCurrentCharacterType: (type: CharacterType) => void;
  setCurrentCharacter: (character: OwnedCharacter | null) => void;
  checkNFTOwnership: () => Promise<void>;
}

export const useNFT = create<NFTState>()(
  persist(
    (set, get) => ({
      hasCharacterNFT: false,
      ownedCharacters: [],
      selectedCharacterTokenId: null,
      currentCharacterType: 'shadow',
      currentCharacter: null,
      
      setHasCharacterNFT: (hasNFT) => {
        set({ hasCharacterNFT: hasNFT });
      },
      
      addOwnedCharacter: (character) => {
        const state = get();
        const updatedCharacters = [...state.ownedCharacters, character];
        set({ 
          ownedCharacters: updatedCharacters,
          hasCharacterNFT: true,
          selectedCharacterTokenId: character.tokenId,
          currentCharacterType: character.characterType
        });
      },
      
      setSelectedCharacter: (tokenId) => {
        const state = get();
        const character = state.ownedCharacters.find(char => char.tokenId === tokenId);
        if (character) {
          set({ 
            selectedCharacterTokenId: tokenId,
            currentCharacterType: character.characterType
          });
        }
      },
      
      setCurrentCharacterType: (type) => {
        set({ currentCharacterType: type });
      },

      setCurrentCharacter: (character) => {
        if (character) {
          set({ 
            currentCharacter: character,
            currentCharacterType: character.characterType,
            hasCharacterNFT: true
          });
        } else {
          set({ 
            currentCharacter: null,
            currentCharacterType: 'shadow',
            hasCharacterNFT: false
          });
        }
      },
      
      checkNFTOwnership: async () => {
        // This would integrate with Thirdweb to check actual NFT ownership
        // For now, we'll use the persisted state
        console.log("Checking NFT ownership...");
        
        // TODO: Implement actual NFT ownership check using Thirdweb SDK
        // const contract = "0x00005A2F0e8F4303F719A9f45F25cA578F4AA500";
        // const balance = await contract.balanceOf(address);
        // set({ hasCharacterNFT: balance.gt(0) });
      }
    }),
    {
      name: "nft-storage",
    }
  )
);
