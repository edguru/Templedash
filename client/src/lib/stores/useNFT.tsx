import { create } from "zustand";
import { persist } from "zustand/middleware";

type CharacterType = 'shadow' | 'red' | 'blue' | 'green';

interface NFTState {
  hasCharacterNFT: boolean;
  characterTokenId: string | null;
  characterType: CharacterType;
  
  // Actions
  setHasCharacterNFT: (hasNFT: boolean) => void;
  setCharacterTokenId: (tokenId: string | null) => void;
  setCharacterType: (type: CharacterType) => void;
  checkNFTOwnership: () => Promise<void>;
}

export const useNFT = create<NFTState>()(
  persist(
    (set, get) => ({
      hasCharacterNFT: false,
      characterTokenId: null,
      characterType: 'shadow',
      
      setHasCharacterNFT: (hasNFT) => {
        set({ hasCharacterNFT: hasNFT });
      },
      
      setCharacterTokenId: (tokenId) => {
        set({ characterTokenId: tokenId });
      },
      
      setCharacterType: (type) => {
        set({ characterType: type });
      },
      
      checkNFTOwnership: async () => {
        // This would integrate with Thirdweb to check actual NFT ownership
        // For now, we'll use the persisted state
        console.log("Checking NFT ownership...");
        
        // TODO: Implement actual NFT ownership check using Thirdweb SDK
        // const { contract } = useContract(NFT_CONTRACT_ADDRESS);
        // const balance = await contract.balanceOf(address);
        // set({ hasCharacterNFT: balance.gt(0) });
      }
    }),
    {
      name: "nft-storage",
    }
  )
);
