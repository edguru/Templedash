import { getNFTContract, MYSTERY_BOX_CONFIG, SOCIAL_CONFIG } from './thirdweb';
import { prepareContractCall, sendTransaction } from "thirdweb";
import { useActiveAccount, useSendTransaction } from "thirdweb/react";
import { useState, useCallback } from 'react';

export interface NFTCharacter {
  tokenId: string;
  characterType: string;
  owner: string;
  transactionHash: string;
  metadata?: any;
}

export interface MysteryBoxReward {
  type: 'token' | 'jackpot';
  amount: number;
  currency: string;
  transactionHash?: string;
}

// NFT and Mystery Box service using Thirdweb v5
export const useNFTService = () => {
  const account = useActiveAccount();
  const { mutate: sendTx, isPending } = useSendTransaction();
  const [isProcessing, setIsProcessing] = useState(false);

  const mintNFT = useCallback(async (characterType: string) => {
    if (!account) throw new Error('No wallet connected');
    
    setIsProcessing(true);
    try {
      const contract = getNFTContract();
      const transaction = prepareContractCall({
        contract,
        method: "mint",
        params: [account.address, characterType],
      });

      return new Promise((resolve, reject) => {
        sendTx(transaction, {
          onSuccess: (result) => {
            setIsProcessing(false);
            resolve({
              success: true,
              transactionHash: result.transactionHash,
              tokenId: Date.now().toString(), // This would come from contract event
            });
          },
          onError: (error) => {
            setIsProcessing(false);
            reject(error);
          },
        });
      });
    } catch (error) {
      setIsProcessing(false);
      throw error;
    }
  }, [account, sendTx]);

  const openMysteryBox = useCallback(async (): Promise<MysteryBoxReward> => {
    if (!account) throw new Error('No wallet connected');

    // Check if user already claimed mystery box (this would be stored in backend)
    const hasClaimedBox = localStorage.getItem(`mysteryBox_${account.address}`);
    if (hasClaimedBox) {
      throw new Error('You can only claim one mystery box per account');
    }

    // Determine reward type
    const isJackpot = Math.random() < (1 / MYSTERY_BOX_CONFIG.JACKPOT_ODDS);
    
    const reward: MysteryBoxReward = {
      type: isJackpot ? 'jackpot' : 'token',
      amount: isJackpot ? MYSTERY_BOX_CONFIG.JACKPOT_REWARD : MYSTERY_BOX_CONFIG.PUPPETS_TOKEN_REWARD,
      currency: 'PUPPETS',
    };

    // Mark as claimed
    localStorage.setItem(`mysteryBox_${account.address}`, 'true');
    
    // In a real implementation, this would trigger token transfer
    console.log(`Mystery box opened! Reward: ${reward.amount} ${reward.currency}`);
    
    return reward;
  }, [account]);

  const shareOnX = useCallback((reward: MysteryBoxReward) => {
    const shareText = `${SOCIAL_CONFIG.TWITTER_SHARE_TEXT}\n\nJust won ${reward.amount} ${reward.currency} tokens! 💰`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&hashtags=${SOCIAL_CONFIG.TWITTER_HASHTAGS}`;
    window.open(twitterUrl, '_blank');
  }, []);

  return {
    mintNFT,
    openMysteryBox,
    shareOnX,
    isProcessing: isProcessing || isPending,
    userAddress: account?.address,
  };
};

// Legacy class for backward compatibility
export class NFTService {
  private contractAddress: string = "0x00005A2F0e8F4303F719A9f45F25cA578F4AA500";

  constructor(contractAddress?: string) {
    if (contractAddress) {
      this.contractAddress = contractAddress;
    }
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
      chainId: 123420001114,
      explorer: `https://basescan.org/address/${this.contractAddress}`
    };
  }
}

export const nftService = new NFTService();