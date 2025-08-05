import { PrivyProvider } from '@privy-io/react-auth';

// Privy configuration
export const privyConfig = {
  appId: 'your-privy-app-id', // Replace with actual app ID
  config: {
    loginMethods: ['wallet'],
    appearance: {
      theme: 'light',
      accentColor: '#9333EA',
      logo: 'https://your-logo-url.com', // Replace with actual logo
    },
    embeddedWallets: {
      createOnLogin: 'users-without-wallets',
    },
  },
};