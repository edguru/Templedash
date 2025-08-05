import { create } from "zustand";

interface PlayerState {
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  isJumping: boolean;
  isMoving: boolean;
  isMovingLeft: boolean;
  isMovingRight: boolean;
  
  // Actions
  updatePosition: (delta: number, gameSpeed: number) => void;
  jump: () => void;
  moveLeft: () => void;
  moveRight: () => void;
  resetPlayer: () => void;
}

const MOVE_SPEED = 0.16; // reduced by 50x (was 8)
const JUMP_FORCE = 0.24; // reduced by 50x (was 12)
const GRAVITY = -0.5; // reduced by 50x (was -25)
const GROUND_Y = 0;
const MAX_X = 8;
const MIN_X = -8;

export const usePlayer = create<PlayerState>((set, get) => ({
  position: { x: 0, y: GROUND_Y, z: 0 },
  velocity: { x: 0, y: 0, z: 0 },
  isJumping: false,
  isMoving: false,
  isMovingLeft: false,
  isMovingRight: false,
  
  updatePosition: (delta, gameSpeed) => {
    const state = get();
    const newPosition = { ...state.position };
    const newVelocity = { ...state.velocity };
    
    // Apply gravity
    if (newPosition.y > GROUND_Y || newVelocity.y !== 0) {
      newVelocity.y += GRAVITY * delta;
      newPosition.y += newVelocity.y * delta;
      
      // Ground collision
      if (newPosition.y <= GROUND_Y) {
        newPosition.y = GROUND_Y;
        newVelocity.y = 0;
        set({ isJumping: false });
      }
    }
    
    // Apply horizontal movement decay
    newVelocity.x *= 0.9;
    newPosition.x += newVelocity.x * delta;
    
    // Clamp horizontal position
    newPosition.x = Math.max(MIN_X, Math.min(MAX_X, newPosition.x));
    
    // Update forward movement (for distance tracking)
    newPosition.z -= gameSpeed;
    
    set({ 
      position: newPosition, 
      velocity: newVelocity,
      isMoving: Math.abs(newVelocity.x) > 0.1
    });
  },
  
  jump: () => {
    const state = get();
    if (!state.isJumping && state.position.y <= GROUND_Y + 0.1) {
      set({ 
        velocity: { ...state.velocity, y: JUMP_FORCE },
        isJumping: true 
      });
    }
  },
  
  moveLeft: () => {
    const state = get();
    set({ 
      velocity: { 
        ...state.velocity, 
        x: Math.max(state.velocity.x - MOVE_SPEED, -MOVE_SPEED) 
      },
      isMovingLeft: true,
      isMovingRight: false
    });
    // Reset direction flags after brief time
    setTimeout(() => set({ isMovingLeft: false }), 150);
  },
  
  moveRight: () => {
    const state = get();
    set({ 
      velocity: { 
        ...state.velocity, 
        x: Math.min(state.velocity.x + MOVE_SPEED, MOVE_SPEED) 
      },
      isMovingRight: true,
      isMovingLeft: false
    });
    // Reset direction flags after brief time
    setTimeout(() => set({ isMovingRight: false }), 150);
  },
  
  resetPlayer: () => {
    set({
      position: { x: 0, y: GROUND_Y, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      isJumping: false,
      isMoving: false,
      isMovingLeft: false,
      isMovingRight: false
    });
  }
}));
