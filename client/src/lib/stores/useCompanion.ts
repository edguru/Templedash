import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CompanionTraits } from '../companionService';

interface CompanionState {
  companion: CompanionTraits | null;
  hasCompanionNFT: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setCompanion: (companion: CompanionTraits | null) => void;
  setHasCompanionNFT: (hasNFT: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearCompanion: () => void;
  updateCompanionTraits: (traits: Partial<CompanionTraits>) => void;
}

export const useCompanion = create<CompanionState>()(
  persist(
    (set, get) => ({
      companion: null,
      hasCompanionNFT: false,
      isLoading: false,
      error: null,

      setCompanion: (companion) => {
        set({ companion, hasCompanionNFT: !!companion });
      },

      setHasCompanionNFT: (hasNFT) => {
        set({ hasCompanionNFT: hasNFT });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      setError: (error) => {
        set({ error });
      },

      clearCompanion: () => {
        set({ companion: null, hasCompanionNFT: false, error: null });
      },

      updateCompanionTraits: (traits) => {
        const currentCompanion = get().companion;
        if (currentCompanion) {
          set({ 
            companion: { ...currentCompanion, ...traits } 
          });
        }
      },
    }),
    {
      name: 'companion-storage',
      partialize: (state) => ({
        companion: state.companion,
        hasCompanionNFT: state.hasCompanionNFT,
      }),
    }
  )
);