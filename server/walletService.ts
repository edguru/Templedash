import { ethers } from 'ethers';
import { db } from './storage';
import { wallets, contracts } from '../shared/schema';
import { eq } from 'drizzle-orm';

// ERC721 Contract ABI (simplified for basic minting)
const ERC721_ABI = [
  "constructor(string memory name, string memory symbol)",
  "function mint(address to, uint256 tokenId) public",
  "function ownerOf(uint256 tokenId) public view returns (address)",
  "function totalSupply() public view returns (uint256)",
  "function balanceOf(address owner) public view returns (uint256)",
  "function tokenURI(uint256 tokenId) public view returns (string memory)",
  "function setTokenURI(uint256 tokenId, string memory uri) public",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
];

// Simple ERC721 Contract Bytecode (basic implementation)
const ERC721_BYTECODE = "0x608060405234801561001057600080fd5b5060405161174638038061174683398101604081905261002f91610180565b81516100429060009060208501906100d6565b5080516100569060019060208401906100d6565b50506002805460010190556100823373c89efdaa54c0f20c7adf612882df0950f5a951637adf612882df0950f5a95163600084815260046020526040902055565b6100923373c89efdaa54c0f20c7adf612882df0950f5a95163600190565b50505061024a565b8280546100e2906101db565b90600052602060002090601f016020900481019282610104576000855561014a565b82601f1061011d57805160ff191683800117855561014a565b8280016001018555821561014a579182015b8281111561014a57825182559160200191906001019061012f565b5061015692915061015a565b5090565b5b80821115610156576000815560010161015b565b634e487b7160e01b600052604160045260246000fd5b600080604083850312156101a357600080fd5b82516001600160401b03808211156101ba57600080fd5b818501915085601f8301126101ce57600080fd5b8151818111156101e0576101e061016f565b604051601f8201601f19908116603f011681019083821181831017156102085761020861016f565b8160405282815260209350888484870101111561022457600080fd5b600091505b8282101561024657848201840151818301850152908301906102e9565b50909695505050505050565b6114ed806102596000396000f3fe";

export interface NetworkConfig {
  chainId: number;
  rpcUrl: string;
  networkName: string;
  blockExplorerUrl?: string;
}

// Default network configurations
export const NETWORKS: { [key: string]: NetworkConfig } = {
  sepolia: {
    chainId: 11155111,
    rpcUrl: "https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161", // Public RPC
    networkName: "Sepolia",
    blockExplorerUrl: "https://sepolia.etherscan.io"
  },
  goerli: {
    chainId: 5,
    rpcUrl: "https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161", // Public RPC
    networkName: "Goerli",
    blockExplorerUrl: "https://goerli.etherscan.io"
  },
  mumbai: {
    chainId: 80001,
    rpcUrl: "https://rpc-mumbai.maticvigil.com",
    networkName: "Mumbai",
    blockExplorerUrl: "https://mumbai.polygonscan.com"
  }
};

/**
 * Generate a new Ethereum wallet
 */
export async function generateWallet(name: string = 'Game Wallet'): Promise<{
  address: string;
  privateKey: string;
  publicKey: string;
  mnemonic: string;
}> {
  try {
    // Generate a random wallet with mnemonic
    const wallet = ethers.Wallet.createRandom();
    
    const walletData = {
      address: wallet.address,
      privateKey: wallet.privateKey,
      publicKey: wallet.publicKey,
      mnemonic: wallet.mnemonic?.phrase || ''
    };

    // Save to database
    await db.insert(wallets).values({
      name,
      address: walletData.address,
      privateKey: walletData.privateKey,
      publicKey: walletData.publicKey,
      mnemonic: walletData.mnemonic,
      isActive: true
    });

    console.log(`Generated new wallet: ${walletData.address}`);
    return walletData;
  } catch (error) {
    console.error('Error generating wallet:', error);
    throw new Error('Failed to generate wallet');
  }
}

/**
 * Deploy ERC721 contract to specified network
 */
export async function deployERC721Contract(
  walletId: number,
  networkName: string = 'sepolia',
  contractName: string = 'Temple Runner NFT',
  contractSymbol: string = 'TRN'
): Promise<{
  contractAddress: string;
  transactionHash: string;
  blockNumber: number;
}> {
  try {
    // Get wallet from database
    const wallet = await db.select().from(wallets).where(eq(wallets.id, walletId)).limit(1);
    if (wallet.length === 0) {
      throw new Error('Wallet not found');
    }

    const walletData = wallet[0];
    const networkConfig = NETWORKS[networkName];
    if (!networkConfig) {
      throw new Error(`Network ${networkName} not supported`);
    }

    // Create provider and signer
    const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
    const signer = new ethers.Wallet(walletData.privateKey, provider);

    // Check balance
    const balance = await provider.getBalance(signer.address);
    console.log(`Wallet balance: ${ethers.formatEther(balance)} ETH`);

    if (balance === BigInt(0)) {
      throw new Error('Wallet has no ETH for gas fees. Please add testnet ETH to: ' + signer.address);
    }

    // Create contract factory
    const contractFactory = new ethers.ContractFactory(ERC721_ABI, ERC721_BYTECODE, signer);
    
    // Deploy contract
    console.log('Deploying ERC721 contract...');
    const contract = await contractFactory.deploy(contractName, contractSymbol, {
      gasLimit: 3000000
    });

    // Wait for deployment
    const deploymentReceipt = await contract.deploymentTransaction()?.wait();
    if (!deploymentReceipt) {
      throw new Error('Contract deployment failed');
    }

    const contractAddress = await contract.getAddress();
    console.log(`Contract deployed at: ${contractAddress}`);
    console.log(`Transaction hash: ${deploymentReceipt.hash}`);
    console.log(`Block number: ${deploymentReceipt.blockNumber}`);

    // Save contract to database
    await db.insert(contracts).values({
      name: contractName,
      contractAddress,
      privateKey: walletData.privateKey,
      publicKey: walletData.publicKey,
      chainId: networkConfig.chainId,
      rpcUrl: networkConfig.rpcUrl,
      networkName: networkConfig.networkName,
      blockExplorerUrl: networkConfig.blockExplorerUrl,
      isActive: true
    });

    return {
      contractAddress,
      transactionHash: deploymentReceipt.hash,
      blockNumber: deploymentReceipt.blockNumber || 0
    };
  } catch (error) {
    console.error('Error deploying contract:', error);
    throw error;
  }
}

/**
 * Get wallet by ID
 */
export async function getWallet(walletId: number) {
  const wallet = await db.select().from(wallets).where(eq(wallets.id, walletId)).limit(1);
  return wallet.length > 0 ? wallet[0] : null;
}

/**
 * Get all contracts
 */
export async function getContracts() {
  return await db.select().from(contracts);
}

/**
 * Get active contract
 */
export async function getActiveContract() {
  const contract = await db.select().from(contracts).where(eq(contracts.isActive, true)).limit(1);
  return contract.length > 0 ? contract[0] : null;
}

/**
 * Mint NFT to address
 */
export async function mintNFT(contractId: number, toAddress: string, tokenId: number): Promise<{
  transactionHash: string;
  tokenId: number;
}> {
  try {
    // Get contract from database
    const contractData = await db.select().from(contracts).where(eq(contracts.id, contractId)).limit(1);
    if (contractData.length === 0) {
      throw new Error('Contract not found');
    }

    const contract = contractData[0];
    
    // Create provider and signer
    const provider = new ethers.JsonRpcProvider(contract.rpcUrl);
    const signer = new ethers.Wallet(contract.privateKey, provider);

    // Create contract instance
    const contractInstance = new ethers.Contract(contract.contractAddress, ERC721_ABI, signer);

    // Mint NFT
    console.log(`Minting NFT ${tokenId} to ${toAddress}...`);
    const tx = await contractInstance.mint(toAddress, tokenId);
    const receipt = await tx.wait();

    console.log(`NFT minted successfully. Transaction: ${receipt.hash}`);

    return {
      transactionHash: receipt.hash,
      tokenId
    };
  } catch (error) {
    console.error('Error minting NFT:', error);
    throw error;
  }
}