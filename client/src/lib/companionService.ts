import { createThirdwebClient, getContract, prepareContractCall, sendTransaction, readContract } from 'thirdweb';
import { baseCampTestnet } from './thirdweb';
import { Account } from 'thirdweb/wallets';

// Contract configuration
const COMPANION_CONTRACT_ADDRESS = "0x742d35Cc6e2C3e312318508CF3c66E2E2B45A1b5"; // CompanionNFT deployed on Base Camp Testnet
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
  private contract;

  constructor() {
    this.contract = getContract({
      client,
      chain: baseCampTestnet,
      address: COMPANION_CONTRACT_ADDRESS,
    });
  }

  async hasCompanion(address: string): Promise<boolean> {
    try {
      // For now, return false since contract is not fully deployed
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
      // For now, simulate minting
      const mockTxHash = `0x${Math.random().toString(16).substring(2, 66)}`;
      console.log('Simulating companion mint:', traits);
      return mockTxHash;
    } catch (error) {
      console.error('Error minting companion:', error);
      throw new Error(`Failed to mint companion: ${(error as Error).message}`);
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