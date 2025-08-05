import { db } from './storage';
import { contracts } from '../shared/schema';
import { eq } from 'drizzle-orm';

export interface ContractData {
  name: string;
  contractAddress: string;
  privateKey?: string;
  publicKey?: string;
  chainId: number;
}

// Store contract address and keys in database
export async function storeContract(contractData: ContractData) {
  try {
    const result = await db.insert(contracts).values({
      name: contractData.name,
      contractAddress: contractData.contractAddress,
      privateKey: contractData.privateKey,
      publicKey: contractData.publicKey,
      chainId: contractData.chainId,
      isActive: true
    }).returning();
    
    return result[0];
  } catch (error) {
    console.error('Error storing contract:', error);
    throw error;
  }
}

// Get active contract by name
export async function getContract(name: string) {
  try {
    const result = await db
      .select()
      .from(contracts)
      .where(eq(contracts.name, name))
      .limit(1);
    
    return result[0] || null;
  } catch (error) {
    console.error('Error fetching contract:', error);
    return null;
  }
}

// Update contract address
export async function updateContractAddress(name: string, address: string) {
  try {
    const result = await db
      .update(contracts)
      .set({ contractAddress: address })
      .where(eq(contracts.name, name))
      .returning();
    
    return result[0];
  } catch (error) {
    console.error('Error updating contract address:', error);
    throw error;
  }
}

// Get all contracts
export async function getAllContracts() {
  try {
    return await db.select().from(contracts);
  } catch (error) {
    console.error('Error fetching all contracts:', error);
    return [];
  }
}