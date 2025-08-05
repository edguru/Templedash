// import { Chain } from "@thirdweb-dev/chains";

// Thirdweb configuration
export const clientId = process.env.VITE_THIRDWEB_CLIENT_ID || "your-client-id";

// Use Polygon for lower gas fees, or change to your preferred chain
export const activeChain = {
  chainId: 137, // Polygon Mainnet
  rpc: ["https://polygon-rpc.com/"],
  nativeCurrency: {
    decimals: 18,
    name: "Matic",
    symbol: "MATIC",
  },
  shortName: "polygon",
  slug: "polygon",
  testnet: false,
  chain: "Polygon",
  name: "Polygon Mainnet",
};

// Your deployed NFT contract address
export const NFT_CONTRACT_ADDRESS = process.env.VITE_NFT_CONTRACT_ADDRESS || "0x...";

// Thirdweb SDK configuration
export const sdkOptions = {
  gasless: {
    openzeppelin: {
      relayerUrl: process.env.VITE_OPENZEPPELIN_RELAYER_URL,
    },
  },
};
