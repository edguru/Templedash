import { createThirdwebClient, defineChain, getContract } from "thirdweb";

// Environment variables for Base Camp testnet (keeping original for contract compatibility)
export const CHAIN_CONFIG = {
  CHAIN_ID: Number(import.meta.env.VITE_CHAIN_ID) || 123420001114,
  RPC_URL: import.meta.env.VITE_RPC_URL || "https://rpc.camp-network-testnet.gelato.digital",
  BLOCK_EXPLORER_URL: import.meta.env.VITE_BLOCK_EXPLORER_URL || "https://explorer.camp-network-testnet.gelato.digital",
  NETWORK_NAME: import.meta.env.VITE_NETWORK_NAME || "Base Camp Testnet",
};

export const NFT_CONTRACT_ADDRESS = import.meta.env.VITE_NFT_CONTRACT_ADDRESS || "0x00005A2F0e8F4303F719A9f45F25cA578F4AA500";
const THIRDWEB_CLIENT_ID = import.meta.env.VITE_THIRDWEB_CLIENT_ID;

if (!THIRDWEB_CLIENT_ID) {
  console.warn("VITE_THIRDWEB_CLIENT_ID is not set. Please add it to your environment variables.");
}

// Create Thirdweb client
export const client = createThirdwebClient({
  clientId: THIRDWEB_CLIENT_ID || "demo-client-id"
});

// Define Base Camp testnet using defineChain method  
export const baseCampTestnet = defineChain({
  id: CHAIN_CONFIG.CHAIN_ID,
  name: CHAIN_CONFIG.NETWORK_NAME,
  nativeCurrency: {
    name: "CAMP",
    symbol: "CAMP", 
    decimals: 18,
  },
  rpc: CHAIN_CONFIG.RPC_URL,
  blockExplorers: [{
    name: "Base Camp Explorer",
    url: CHAIN_CONFIG.BLOCK_EXPLORER_URL
  }],
  testnet: true
});

// Mystery box configuration
export const MYSTERY_BOX_CONFIG = {
  PUPPETS_TOKEN_REWARD: Number(import.meta.env.VITE_PUPPETS_TOKEN_STANDARD_REWARD) || 0.001,
  JACKPOT_REWARD: Number(import.meta.env.VITE_PUPPETS_TOKEN_JACKPOT_REWARD) || 10,
  JACKPOT_ODDS: Number(import.meta.env.VITE_JACKPOT_ODDS) || 5000,
  MAX_BOXES_PER_USER: 1
};

// Social sharing configuration  
export const SOCIAL_CONFIG = {
  TWITTER_SHARE_URL: import.meta.env.VITE_TWITTER_SHARE_URL || "https://twitter.com/intent/tweet",
  PUPPETS_AI_HANDLE: import.meta.env.VITE_PUPPETS_AI_HANDLE || "@PuppetsAI"
};

// Get NFT contract instance
export const getNFTContract = () => {
  return getContract({
    client,
    chain: baseCampTestnet,
    address: NFT_CONTRACT_ADDRESS,
  });
};