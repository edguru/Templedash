import { defineChain } from 'thirdweb';

// Base Camp testnet configuration
export const baseCamp = defineChain({
  id: 123420001114,
  name: 'Base Camp Testnet',
  nativeCurrency: {
    name: 'CAMP',
    symbol: 'CAMP',
    decimals: 18,
  },
  rpc: 'https://rpc.camp-network-testnet.gelato.digital',
  blockExplorers: [
    {
      name: 'Base Camp Explorer',
      url: 'https://basecamp.blockscout.com',
    },
  ],
  testnet: true,
});