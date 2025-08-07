import { useContract, useContractRead, useContractWrite, useNFTs, useOwnedNFTs } from '@thirdweb-dev/react';
import { NFT_CONTRACT_ADDRESS } from './thirdweb';

export interface NFTCharacter {
  tokenId: string;
  characterType: string;
  owner: string;
  transactionHash: string;
  metadata?: any;
}

// NFT Contract Integration using Thirdweb hooks
export const useNFTContract = () => {
  const { contract } = useContract(NFT_CONTRACT_ADDRESS);
  return contract;
};

export const useNFTService = (walletAddress?: string) => {
  const contract = useNFTContract();
  const { data: ownedNFTs, isLoading: isLoadingNFTs } = useOwnedNFTs(contract, walletAddress);
  const { mutateAsync: mintNFT, isLoading: isMinting } = useContractWrite(contract, "mint");

  return {
    contract,
    ownedNFTs,
    isLoadingNFTs,
    mintNFT,
    isMinting,
  };
};

// Legacy class for backward compatibility
export class NFTService {
  private contractAddress: string;

  constructor(contractAddress = NFT_CONTRACT_ADDRESS) {
    this.contractAddress = contractAddress;
  }

  // Check if user owns any character NFTs (use hooks instead for React components)
  async checkNFTOwnership(walletAddress: string): Promise<boolean> {
    try {
      console.log(`Checking NFT ownership for ${walletAddress}`);
      // This is now handled by useNFTService hook
      return false; // Use hooks in components instead
    } catch (error) {
      console.error('Error checking NFT ownership:', error);
      return false;
    }
  }

  // Get user's character NFTs (use hooks instead for React components)
  async getUserCharacters(walletAddress: string): Promise<NFTCharacter[]> {
    try {
      console.log(`Fetching characters for ${walletAddress}`);
      // This is now handled by useNFTService hook
      return []; // Use hooks in components instead
    } catch (error) {
      console.error('Error fetching user characters:', error);
      return [];
    }
  }

  // Mint a new character NFT
  async mintCharacter(characterType: string): Promise<{ success: boolean; tokenId?: string; transactionHash?: string }> {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not found');
      }

      console.log(`Minting ${characterType} character`);
      
      // TODO: Replace with actual contract interaction
      // const provider = new ethers.providers.Web3Provider(window.ethereum);
      // const signer = provider.getSigner();
      // const contract = new ethers.Contract(this.contractAddress, ABI, signer);
      
      // const mintPrice = ethers.utils.parseEther("0.001"); // 0.001 ETH
      // const tx = await contract.mintCharacter(characterType, { value: mintPrice });
      // await tx.wait();
      
      // return {
      //   success: true,
      //   tokenId: tx.events[0].args.tokenId.toString(),
      //   transactionHash: tx.hash
      // };
      
      // Placeholder response
      return {
        success: true,
        tokenId: Date.now().toString(),
        transactionHash: `0x${Date.now().toString(16)}`
      };
    } catch (error) {
      console.error('Error minting character:', error);
      return { success: false };
    }
  }

  // Get contract info
  getContractInfo() {
    return {
      address: this.contractAddress,
      chainId: this.chainId,
      explorer: `https://polygonscan.com/address/${this.contractAddress}`
    };
  }
}

export const nftService = new NFTService();