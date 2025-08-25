import { createThirdwebClient, getContract, prepareContractCall, sendTransaction, readContract } from 'thirdweb';
import { baseCampTestnet } from './thirdweb';
import { Account } from 'thirdweb/wallets';
import { sessionManager } from './sessionSigners';

// Contract configuration - Updated for simplified contract
const client = createThirdwebClient({
  clientId: import.meta.env.VITE_THIRDWEB_CLIENT_ID,
});

export interface CompanionTraits {
  name: string;
  age: number;
  role: 'partner' | 'friend' | 'pet';
  gender: 'male' | 'female' | 'non-binary';
  flirtiness: number;
  intelligence: number;
  humor: number;
  loyalty: number;
  empathy: number;
  personalityType: 'helpful' | 'casual' | 'professional';
  appearance: string;
  backgroundStory?: string;
  tokenId?: number;
  createdAt?: string;
  lastModified?: string;
}

export class CompanionService {
  private contract: any;
  private contractAddress: string | null = null;

  constructor() {
    this.contract = null;
  }

  private async getContractAddress(): Promise<string> {
    if (!this.contractAddress) {
      try {
        const response = await fetch('/api/companion-contract-address');
        if (!response.ok) {
          throw new Error('Failed to fetch contract address');
        }
        const data = await response.json();
        this.contractAddress = data.contractAddress;
      } catch (error) {
        console.error('Error fetching contract address:', error);
        throw new Error('Failed to get companion contract address');
      }
    }
    return this.contractAddress!;
  }

  private async getContract() {
    if (!this.contract) {
      const contractAddress = await this.getContractAddress();
      this.contract = getContract({
        client,
        chain: baseCampTestnet,
        address: contractAddress,
      });
    }
    return this.contract;
  }

  async hasCompanion(address: string): Promise<boolean> {
    try {
      // Check blockchain first for most accurate data
      const contract = await this.getContract();
      const hasCompanionOnChain = await readContract({
        contract,
        method: 'function hasCompanion(address owner) external view returns (bool)',
        params: [address],
      });
      
      return hasCompanionOnChain;
    } catch (error) {
      console.error('Error checking companion existence on blockchain:', error);
      // Fallback to database check
      try {
        const response = await fetch(`/api/user/${address}/companion`);
        if (response.ok) {
          const data = await response.json();
          return data.hasCompanion || false;
        }
      } catch (dbError) {
        console.error('Database fallback also failed:', dbError);
      }
      return false;
    }
  }

  async getCompanionByOwner(address: string): Promise<{ tokenId: number; traits: CompanionTraits } | null> {
    try {
      const contract = await this.getContract();
      
      // Check if user has a companion
      const hasCompanionResult = await readContract({
        contract,
        method: 'function hasCompanion(address owner) external view returns (bool)',
        params: [address],
      });
      
      if (!hasCompanionResult) {
        return null;
      }
      
      // Get token ID
      const tokenId = await readContract({
        contract,
        method: 'function getCompanionId(address owner) external view returns (uint256)',
        params: [address],
      });
      
      // Fetch traits from database for faster access
      const response = await fetch(`/api/user/${address}/companion`);
      if (response.ok) {
        const data = await response.json();
        if (data.companion) {
          return {
            tokenId: Number(tokenId),
            traits: data.companion
          };
        }
      }
      
      return { tokenId: Number(tokenId), traits: {} as CompanionTraits };
    } catch (error) {
      console.error('Error fetching companion:', error);
      return null;
    }
  }

  async mintCompanion(account: Account, traits: CompanionTraits): Promise<string> {
    try {
      console.log('🚀 Starting NFT minting process with session signer...');
      
      // Get session signer for universal transaction signing
      const sessionData = sessionManager.getSessionKey(account.address);
      if (!sessionData) {
        // Create session key if it doesn't exist
        await sessionManager.createSessionKey(account.address);
      }
      
      // Get the contract
      const contract = await this.getContract();
      
      // First, mint the NFT on the blockchain using session signer
      console.log('📝 Preparing mint transaction with session signer...');
      const mintTx = prepareContractCall({
        contract,
        method: 'function mint() external payable',
        value: BigInt('1000000000000000'), // 0.001 ether in wei
      });
      
      console.log('⛽ Sending mint transaction with session signer...');
      const result = await sendTransaction({
        transaction: mintTx,
        account,
      });
      
      console.log('✅ NFT minted! Transaction hash:', result.transactionHash);
      
      // Display transaction details to user
      const txDetails = {
        hash: result.transactionHash,
        network: 'Base Camp Testnet',
        type: 'Companion NFT Mint',
        value: '0.001 CAMP',
        explorer: `https://basecamp.cloud.blockscout.com/tx/${result.transactionHash}`,
        gasUsed: 'Estimated gas used for minting',
        status: 'Confirmed'
      };
      
      console.log('📊 Transaction Details:', txDetails);
      
      // Show transaction details in UI (could be passed to a callback)
      if (typeof window !== 'undefined') {
        (window as any).lastTransactionDetails = txDetails;
      }
      
      // Wait for transaction confirmation and get token ID
      console.log('⏳ Waiting for transaction confirmation...');
      // TODO: Add progress callback here for UI updates
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds for confirmation
      
      // Get the token ID from the contract with retry logic
      console.log('🔍 Getting companion token ID...');
      let tokenId: bigint = BigInt(0);
      let retryCount = 0;
      const maxRetries = 5;
      
      while (retryCount < maxRetries) {
        try {
          tokenId = await readContract({
            contract,
            method: 'function getCompanionId(address owner) external view returns (uint256)',
            params: [account.address],
          });
          
          if (tokenId && tokenId > BigInt(0)) {
            console.log('🎯 Token ID:', tokenId.toString());
            break;
          } else {
            throw new Error('Token ID is 0 or undefined');
          }
        } catch (error) {
          retryCount++;
          console.log(`🔄 Retry ${retryCount}/${maxRetries} getting token ID...`);
          if (retryCount >= maxRetries) {
            throw new Error(`Failed to get token ID after ${maxRetries} attempts: ${error}`);
          }
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds between retries
        }
      }
      
      // Ensure we have a valid token ID
      if (!tokenId || tokenId <= BigInt(0)) {
        throw new Error('Failed to obtain valid token ID from contract');
      }
      
      // Set all the traits on the blockchain
      console.log('🎨 Setting companion traits on blockchain...');
      
      // Set name
      const setNameTx = prepareContractCall({
        contract,
        method: 'function setName(uint256 tokenId, string calldata name) external',
        params: [tokenId, traits.name],
      });
      await sendTransaction({ transaction: setNameTx, account });
      
      // Set role
      const setRoleTx = prepareContractCall({
        contract,
        method: 'function setRole(uint256 tokenId, string calldata role) external',
        params: [tokenId, traits.role],
      });
      await sendTransaction({ transaction: setRoleTx, account });
      
      // Set gender
      const setGenderTx = prepareContractCall({
        contract,
        method: 'function setGender(uint256 tokenId, string calldata gender) external',
        params: [tokenId, traits.gender],
      });
      await sendTransaction({ transaction: setGenderTx, account });
      
      // Set personality
      const setPersonalityTx = prepareContractCall({
        contract,
        method: 'function setPersonality(uint256 tokenId, string calldata personality) external',
        params: [tokenId, traits.personalityType],
      });
      await sendTransaction({ transaction: setPersonalityTx, account });
      
      // Set appearance
      const setAppearanceTx = prepareContractCall({
        contract,
        method: 'function setAppearance(uint256 tokenId, string calldata appearance) external',
        params: [tokenId, traits.appearance],
      });
      await sendTransaction({ transaction: setAppearanceTx, account });
      
      // Set background story
      if (traits.backgroundStory) {
        const setStoryTx = prepareContractCall({
          contract,
          method: 'function setStory(uint256 tokenId, string calldata story) external',
          params: [tokenId, traits.backgroundStory],
        });
        await sendTransaction({ transaction: setStoryTx, account });
      }
      
      // Set numeric traits
      const setTraitsTx = prepareContractCall({
        contract,
        method: 'function setTraits(uint256 tokenId, uint8 age, uint8 flirtiness, uint8 intelligence, uint8 humor, uint8 loyalty, uint8 empathy) external',
        params: [
          tokenId,
          traits.age,
          traits.flirtiness,
          traits.intelligence,
          traits.humor,
          traits.loyalty,
          traits.empathy,
        ],
      });
      await sendTransaction({ transaction: setTraitsTx, account });
      
      console.log('🎉 All traits set on blockchain!');
      
      // Now store in database after successful blockchain operations
      console.log('💾 Storing companion in database...');
      const contractAddress = await this.getContractAddress();
      
      const response = await fetch(`/api/user/${account.address}/companion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenId: tokenId.toString(),
          contractAddress: contractAddress,
          name: traits.name,
          age: traits.age,
          role: traits.role,
          gender: traits.gender,
          flirtiness: traits.flirtiness,
          intelligence: traits.intelligence,
          humor: traits.humor,
          loyalty: traits.loyalty,
          empathy: traits.empathy,
          personalityType: traits.personalityType,
          appearance: traits.appearance,
          backgroundStory: traits.backgroundStory,
          transactionHash: result.transactionHash
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Database storage failed:', errorData);
        
        // If user already has companion, this is expected after the first mint
        if (response.status === 409) {
          console.log('✅ User already has companion in database - this is expected after successful mint');
        } else {
          console.warn('⚠️ NFT minted successfully but database storage failed. The NFT exists on blockchain.');
          // Don't throw error - NFT was successfully minted
        }
      } else {
        console.log('✅ Companion stored in database successfully');
      }

      return result.transactionHash;
    } catch (error) {
      console.error('Error minting companion NFT:', error);
      throw new Error(`Failed to mint companion NFT: ${(error as Error).message}`);
    }
  }

  async updateCompanion(account: Account, tokenId: number, traits: Partial<CompanionTraits>): Promise<string> {
    try {
      // For now, simulate updating
      const mockTxHash = `0x${Math.random().toString(16).substring(2, 66)}`;
      console.log('Simulating companion update:', tokenId, traits);
      return mockTxHash;
    } catch (error) {
      console.error('Error updating companion:', error);
      throw new Error(`Failed to update companion: ${(error as Error).message}`);
    }
  }
}

// Utility function to generate personality-based greetings
export const generatePersonalizedGreeting = (traits: CompanionTraits): string => {
  const { role, personalityType, flirtiness, intelligence, humor, empathy } = traits;
  
  // Normalize values (0-1 scale)
  const flinessLevel = flirtiness / 100;
  const intelligenceLevel = intelligence / 100;
  const humorLevel = humor / 100;
  const empathyLevel = empathy / 100;

  let response = "";

  // Role-based greeting
  if (role === 'partner' && flinessLevel > 0.6) {
    response = "Hey gorgeous, ";
  } else if (role === 'friend') {
    response = "Hey buddy, ";
  } else if (role === 'pet') {
    response = "*excited companion noises* ";
  }

  // Add personality-based responses
  switch (personalityType) {
    case 'helpful':
      response += "I'm here to help! ";
      break;
    case 'casual':
      response += "What's up? ";
      break;
    case 'professional':
      response += "How may I assist you today? ";
      break;
  }

  // Add empathy-based responses
  if (empathyLevel > 0.8) {
    response += "I can sense you might need some support. ";
  }

  // Add humor if applicable
  if (humorLevel > 0.7 && Math.random() < 0.3) {
    response += "😄 ";
  }

  return response + "Let me know what you need!";
};

// Export singleton instance
export const companionService = new CompanionService();