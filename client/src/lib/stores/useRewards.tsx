import { create } from "zustand";
import { persist } from "zustand/middleware";

interface RewardState {
  totalCoins: number;
  completedRuns: number;
  tokenRewards: number;
  mysteryBoxesOpened: number;
  
  // Computed values
  canOpenMysteryBox: boolean;
  
  // Actions
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => void;
  addRun: () => void;
  addTokenReward: (amount: number) => void;
  openMysteryBox: () => void;
  checkMysteryBoxEligibility: () => void;
}

export const useRewards = create<RewardState>()(
  persist(
    (set, get) => ({
      totalCoins: 0,
      completedRuns: 0,
      tokenRewards: 0,
      mysteryBoxesOpened: 0,
      canOpenMysteryBox: false,
      
      addCoins: (amount) => {
        set((state) => ({
          totalCoins: state.totalCoins + amount
        }));
        get().checkMysteryBoxEligibility();
      },
      
      spendCoins: (amount) => {
        set((state) => ({
          totalCoins: Math.max(0, state.totalCoins - amount)
        }));
      },
      
      addRun: () => {
        set((state) => ({
          completedRuns: state.completedRuns + 1
        }));
        get().checkMysteryBoxEligibility();
      },
      
      addTokenReward: (amount) => {
        set((state) => ({
          tokenRewards: state.tokenRewards + amount
        }));
      },
      
      openMysteryBox: () => {
        set((state) => ({
          mysteryBoxesOpened: state.mysteryBoxesOpened + 1,
          canOpenMysteryBox: false
        }));
      },
      
      checkMysteryBoxEligibility: () => {
        const state = get();
        
        // Mystery box every 5 runs or 100 coins
        const runsEligible = (state.completedRuns % 5) === 0 && state.completedRuns > 0;
        const coinsEligible = state.totalCoins >= 100;
        
        const shouldHaveBox = runsEligible || coinsEligible;
        
        set({ canOpenMysteryBox: shouldHaveBox });
      }
    }),
    {
      name: "rewards-storage",
    }
  )
);
