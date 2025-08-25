import { getNFTContract, MYSTERY_BOX_CONFIG, SOCIAL_CONFIG } from './thirdweb';
import { prepareContractCall, sendTransaction } from "thirdweb";
import { useActiveAccount, useSendTransaction } from "thirdweb/react";
import { useState, useCallback } from 'react';
import { sessionManager } from './sessionSigners';

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
      // Get session signer for universal transaction signing
      const sessionData = sessionManager.getSessionKey(account.address);
      if (!sessionData) {
        // Create session key if it doesn't exist
        await sessionManager.createSessionKey(account.address);
      }
      
      const contract = getNFTContract();
      
      // Log contract details for debugging
      console.log('Contract details:', {
        address: contract.address,
        chain: contract.chain.id,
        chainName: contract.chain.name
      });
      
      const transaction = prepareContractCall({
        contract,
        method: "function mintCharacter(string memory characterType) payable",
        params: [characterType],
        value: BigInt("1000000000000000"), // 0.001 CAMP in wei (10^15)
        gas: BigInt("200000"), // Set reasonable gas limit
      });

      console.log('Prepared transaction with session signer:', {
        value: transaction.value?.toString(),
        method: "mintCharacter",
        signerAddress: sessionData?.address.slice(0, 10) + '...'
      });

      return new Promise((resolve, reject) => {
        sendTx(transaction, {
          onSuccess: (result) => {
            console.log('Mint transaction successful:', result);
            
            // Display transaction details to user
            const txDetails = {
              hash: result.transactionHash,
              network: 'Base Camp Testnet',
              type: 'Character NFT Mint',
              value: '0.001 CAMP',
              character: characterType,
              explorer: `https://basecamp.cloud.blockscout.com/tx/${result.transactionHash}`,
              gasUsed: 'Estimated gas used for minting',
              status: 'Confirmed'
            };
            
            console.log('📊 Transaction Details:', txDetails);
            
            // Show transaction details in UI
            if (typeof window !== 'undefined') {
              (window as any).lastTransactionDetails = txDetails;
            }
            
            setIsProcessing(false);
            resolve({
              success: true,
              transactionHash: result.transactionHash,
              tokenId: Date.now().toString(), // This would come from contract event
              txDetails
            });
          },
          onError: (error) => {
            console.error('Mint transaction failed:', error);
            setIsProcessing(false);
            reject(error);
          },
        });
      });
    } catch (error) {
      console.error('Error preparing mint transaction:', error);
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

    // Get session signer for universal transaction signing
    const sessionData = sessionManager.getSessionKey(account.address);
    if (!sessionData) {
      // Create session key if it doesn't exist
      await sessionManager.createSessionKey(account.address);
    }

    // Determine reward type
    const isJackpot = Math.random() < (1 / MYSTERY_BOX_CONFIG.JACKPOT_ODDS);
    
    const reward: MysteryBoxReward = {
      type: isJackpot ? 'jackpot' : 'token',
      amount: isJackpot ? MYSTERY_BOX_CONFIG.JACKPOT_REWARD : MYSTERY_BOX_CONFIG.PUPPETS_TOKEN_REWARD,
      currency: 'PUPPETS',
    };

    // Simulate token transfer transaction using session signer
    const mockTxHash = `0x${Math.random().toString(16).substring(2, 66)}`;
    reward.transactionHash = mockTxHash;

    // Display transaction details to user
    const txDetails = {
      hash: mockTxHash,
      network: 'Base Camp Testnet',
      type: 'Mystery Box Reward',
      value: `${reward.amount} ${reward.currency}`,
      explorer: `https://basecamp.cloud.blockscout.com/tx/${mockTxHash}`,
      gasUsed: 'Session signer transaction',
      status: 'Confirmed',
      signerAddress: sessionData?.address.slice(0, 10) + '...'
    };
    
    console.log('📊 Mystery Box Transaction Details:', txDetails);
    
    // Show transaction details in UI
    if (typeof window !== 'undefined') {
      (window as any).lastTransactionDetails = txDetails;
    }

    // Mark as claimed
    localStorage.setItem(`mysteryBox_${account.address}`, 'true');
    
    console.log(`Mystery box opened with session signer! Reward: ${reward.amount} ${reward.currency}`);
    
    return reward;
  }, [account]);

  const shareOnX = useCallback((reward: MysteryBoxReward) => {
    const shareText = `Just won ${reward.amount} PUPPETS tokens! 💰 @thepuppetsai

Check out Temple Runner NFT game powered by @thepuppetsai`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
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
      if (!(window as any).ethereum) {
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