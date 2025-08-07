import { createThirdwebClient, defineChain, getContract } from "thirdweb";

// Environment variables with defaults for Base Camp
const THIRDWEB_CLIENT_ID = import.meta.env.VITE_THIRDWEB_CLIENT_ID || "your_thirdweb_client_id_here";
const CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID) || 123420001114;
const RPC_URL = import.meta.env.VITE_RPC_URL || "https://rpc.camp-network-testnet.gelato.digital";
export const NFT_CONTRACT_ADDRESS = import.meta.env.VITE_NFT_CONTRACT_ADDRESS || "0x00005A2F0e8F4303F719A9f45F25cA578F4AA500";

// Create the client with your clientId
export const client = createThirdwebClient({
  clientId: THIRDWEB_CLIENT_ID
});

// Define Base Camp testnet
export const baseCampTestnet = defineChain({
  id: CHAIN_ID,
  name: "Base Camp Testnet by Camp Network",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH", 
    decimals: 18,
  },
  rpc: RPC_URL,
  blockExplorers: [{
    name: "Base Camp Explorer",
    url: "https://explorer.camp-network-testnet.gelato.digital"
  }]
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