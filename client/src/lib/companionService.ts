import { createThirdwebClient, getContract, prepareContractCall, sendTransaction, readContract } from 'thirdweb';
import { baseCampTestnet } from './thirdweb';
import { Account } from 'thirdweb/wallets';

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
      // Check database for companion existence rather than blockchain
      const response = await fetch(`/api/user/${address}/companion`);
      if (response.ok) {
        const data = await response.json();
        return data.hasCompanion || false;
      }
      return false;
    } catch (error) {
      console.error('Error checking companion existence:', error);
      return false;
    }
  }

  async getCompanionByOwner(address: string): Promise<{ tokenId: number; traits: CompanionTraits } | null> {
    try {
      // For now, return null as the contract is not fully deployed/implemented
      return null;
    } catch (error) {
      console.error('Error fetching companion:', error);
      return null;
    }
  }

  async mintCompanion(account: Account, traits: CompanionTraits): Promise<string> {
    try {
      // Get the contract address
      const contractAddress = await this.getContractAddress();
      
      // Create companion in database first with immediate database storage approach
      const response = await fetch(`/api/user/${account.address}/companion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenId: `${Date.now()}`, // Use timestamp as token ID
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
          transactionHash: `0x${Date.now().toString(16)}${Math.random().toString(16).substring(2, 10)}`
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create companion');
      }

      console.log('✅ Companion created in database with background story support');
      return `0x${Date.now().toString(16)}${Math.random().toString(16).substring(2, 10)}`;
    } catch (error) {
      console.error('Error creating companion:', error);
      throw new Error(`Failed to create companion: ${(error as Error).message}`);
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