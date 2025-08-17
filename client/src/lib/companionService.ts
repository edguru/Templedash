import { createThirdwebClient, getContract, prepareContractCall, sendTransaction, readContract } from 'thirdweb';
import { baseCampTestnet } from './thirdweb';
import { Account } from 'thirdweb/wallets';

// Contract configuration
const COMPANION_CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000"; // To be deployed
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
      const result = await readContract({
        contract: this.contract,
        method: "function hasCompanion(address owner) view returns (bool)",
        params: [address],
      });
      return result as boolean;
    } catch (error) {
      console.error('Error checking companion existence:', error);
      return false;
    }
  }

  async getCompanionByOwner(address: string): Promise<{ tokenId: number; traits: CompanionTraits } | null> {
    try {
      const result = await readContract({
        contract: this.contract,
        method: "function getCompanionByOwner(address owner) view returns (uint256, tuple(string name, uint8 age, string role, string gender, uint8 flirtiness, uint8 intelligence, uint8 humor, uint8 loyalty, uint8 empathy, string personalityType, string appearance, uint256 createdAt, uint256 lastModified))",
        params: [address],
      });

      const [tokenId, rawTraits] = result as [bigint, any[]];
      
      const traits: CompanionTraits = {
        name: rawTraits[0],
        age: Number(rawTraits[1]),
        role: rawTraits[2] as 'partner' | 'friend' | 'pet',
        gender: rawTraits[3] as 'male' | 'female' | 'non-binary',
        flirtiness: Number(rawTraits[4]),
        intelligence: Number(rawTraits[5]),
        humor: Number(rawTraits[6]),
        loyalty: Number(rawTraits[7]),
        empathy: Number(rawTraits[8]),
        personalityType: rawTraits[9] as 'helpful' | 'casual' | 'professional',
        appearance: rawTraits[10],
        tokenId: Number(tokenId),
        createdAt: new Date(Number(rawTraits[11]) * 1000).toISOString(),
        lastModified: new Date(Number(rawTraits[12]) * 1000).toISOString(),
      };

      return { tokenId: Number(tokenId), traits };
    } catch (error) {
      console.error('Error fetching companion:', error);
      return null;
    }
  }

  async mintCompanion(account: Account, traits: CompanionTraits): Promise<string> {
    try {
      const transaction = prepareContractCall({
        contract: this.contract,
        method: "function mintCompanion(string memory name, uint8 age, string memory role, string memory gender, uint8 flirtiness, uint8 intelligence, uint8 humor, uint8 loyalty, uint8 empathy, string memory personalityType, string memory appearance) payable",
        params: [
          traits.name,
          traits.age,
          traits.role,
          traits.gender,
          traits.flirtiness,
          traits.intelligence,
          traits.humor,
          traits.loyalty,
          traits.empathy,
          traits.personalityType,
          traits.appearance,
        ],
        value: BigInt('1000000000000000'), // 0.001 CAMP in wei
      });

      const result = await sendTransaction({
        transaction,
        account,
      });

      return result.transactionHash;
    } catch (error) {
      console.error('Error minting companion:', error);
      throw error;
    }
  }

  async updateCompanionTraits(account: Account, tokenId: number, traits: CompanionTraits): Promise<string> {
    try {
      const transaction = prepareContractCall({
        contract: this.contract,
        method: "function updateTraits(uint256 tokenId, string memory name, uint8 age, string memory role, string memory gender, uint8 flirtiness, uint8 intelligence, uint8 humor, uint8 loyalty, uint8 empathy, string memory personalityType, string memory appearance)",
        params: [
          BigInt(tokenId),
          traits.name,
          traits.age,
          traits.role,
          traits.gender,
          traits.flirtiness,
          traits.intelligence,
          traits.humor,
          traits.loyalty,
          traits.empathy,
          traits.personalityType,
          traits.appearance,
        ],
      });

      const result = await sendTransaction({
        transaction,
        account,
      });

      return result.transactionHash;
    } catch (error) {
      console.error('Error updating companion traits:', error);
      throw error;
    }
  }

  async getTotalSupply(): Promise<number> {
    try {
      const result = await readContract({
        contract: this.contract,
        method: "function totalSupply() view returns (uint256)",
        params: [],
      });
      return Number(result);
    } catch (error) {
      console.error('Error fetching total supply:', error);
      return 0;
    }
  }

  // Deploy contract function - to be used once
  static async deployContract(account: Account): Promise<string> {
    try {
      // This would typically use a contract deployment service
      // For now, returning a placeholder address
      console.log('Deploying CompanionSoulboundToken contract...');
      
      // In a real implementation, you'd deploy the contract here
      // const deployTransaction = await deployContract({...});
      
      throw new Error('Contract deployment not implemented yet. Please deploy manually and update COMPANION_CONTRACT_ADDRESS.');
    } catch (error) {
      console.error('Error deploying contract:', error);
      throw error;
    }
  }
}

// Singleton instance
export const companionService = new CompanionService();

// Utility functions for companion interaction
export const generateCompanionResponse = (traits: CompanionTraits, message: string): string => {
  // Generate responses based on companion traits
  const flirtLevel = traits.flirtiness / 100;
  const humorLevel = traits.humor / 100;
  const empathyLevel = traits.empathy / 100;

  // Basic response generation logic
  let response = "";

  if (traits.role === 'partner' && flirtLevel > 0.7) {
    response = "Hey gorgeous, ";
  } else if (traits.role === 'friend') {
    response = "Hey buddy, ";
  } else if (traits.role === 'pet') {
    response = "*excited companion noises* ";
  }

  // Add personality-based responses
  switch (traits.personalityType) {
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