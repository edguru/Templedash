import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  walletAddress: string;
  username: string | null;
  totalTokensEarned: string;
  totalTokensClaimed: string;
  createdAt: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (walletAddress: string, username?: string) => Promise<void>;
  logout: () => void;
  submitScore: (score: number, distance: number, coinsCollected: number, characterUsed: string) => Promise<number>;
  claimMysteryBox: () => Promise<number>;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (walletAddress: string, username?: string) => {
        set({ isLoading: true });
        try {
          const response = await fetch('/api/auth/wallet', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ walletAddress, username }),
          });

          if (!response.ok) {
            throw new Error('Authentication failed');
          }

          const data = await response.json();
          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          console.error('Login error:', error);
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      submitScore: async (score: number, distance: number, coinsCollected: number, characterUsed: string) => {
        const { token } = get();
        if (!token) throw new Error('Not authenticated');

        try {
          const response = await fetch('/api/game/score', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ score, distance, coinsCollected, characterUsed }),
          });

          if (!response.ok) {
            throw new Error('Failed to submit score');
          }

          const data = await response.json();
          return data.tokenReward || 0;
        } catch (error) {
          console.error('Score submission error:', error);
          return 0;
        }
      },

      claimMysteryBox: async () => {
        const { token } = get();
        if (!token) throw new Error('Not authenticated');

        try {
          const response = await fetch('/api/game/mystery-box', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            throw new Error('Failed to claim mystery box');
          }

          const data = await response.json();
          return data.reward || 0;
        } catch (error) {
          console.error('Mystery box claim error:', error);
          return 0;
        }
      },
    }),
    {
      name: 'temple-runner-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);