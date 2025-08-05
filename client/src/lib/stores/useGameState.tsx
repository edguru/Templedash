import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export type GamePhase = "start" | "playing" | "gameOver" | "mint" | "mysteryBox";

interface GameState {
  gamePhase: GamePhase;
  score: number;
  distance: number;
  isGameActive: boolean;
  
  // Actions
  setGamePhase: (phase: GamePhase) => void;
  startGame: () => void;
  endGame: () => void;
  restartGame: () => void;
  addScore: (points: number) => void;
  updateDistance: (dist: number) => void;
  resetGame: () => void;
}

export const useGameState = create<GameState>()(
  subscribeWithSelector((set, get) => ({
    gamePhase: "start",
    score: 0,
    distance: 0,
    isGameActive: false,
    
    setGamePhase: (phase) => {
      set({ gamePhase: phase });
    },
    
    startGame: () => {
      set({ 
        gamePhase: "playing", 
        isGameActive: true,
        score: 0,
        distance: 0
      });
    },
    
    endGame: () => {
      set({ 
        gamePhase: "gameOver", 
        isGameActive: false 
      });
    },
    
    restartGame: () => {
      set({ 
        gamePhase: "playing", 
        isGameActive: true,
        score: 0,
        distance: 0
      });
    },
    
    addScore: (points) => {
      set((state) => ({ 
        score: state.score + points 
      }));
    },
    
    updateDistance: (dist) => {
      set({ distance: dist });
    },
    
    resetGame: () => {
      set({
        score: 0,
        distance: 0,
        isGameActive: false
      });
    }
  }))
);
