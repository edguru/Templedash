import { createThirdwebClient, getContract } from "thirdweb";
import { defineChain } from "thirdweb/chains";

// Base Camp Testnet by Camp Network
export const baseCampTestnet = defineChain(123420001114);

// NFT Contract configuration
export const NFT_CONTRACT_ADDRESS = "0x00005A2F0e8F4303F719A9f45F25cA578F4AA500";

// Thirdweb v5 client configuration
export const client = createThirdwebClient({
  clientId: import.meta.env.VITE_THIRDWEB_CLIENT_ID || "YOUR_CLIENT_ID",
});

// Get NFT contract instance
export const getNFTContract = () => {
  return getContract({
    client,
    chain: baseCampTestnet,
    address: NFT_CONTRACT_ADDRESS,
  });
};

// Mystery Box reward configuration
export const MYSTERY_BOX_CONFIG = {
  PUPPETS_TOKEN_REWARD: 0.001, // $0.001 worth of Puppets AI token
  JACKPOT_REWARD: 10, // $10 reward
  JACKPOT_ODDS: 5000, // 1 in 5000 chance
  MAX_BOXES_PER_USER: 1, // Only 1 mystery box per person
};

// Social sharing configuration
export const SOCIAL_CONFIG = {
  TWITTER_SHARE_TEXT: "Just earned rewards in Temple Runner - the NFT-powered infinite runner! 🏃‍♂️💎 Play now and earn real crypto rewards! @PuppetsAI",
  TWITTER_HASHTAGS: "TempleRunner,NFTGaming,Web3Gaming,PuppetsAI,CryptoRewards",
};
