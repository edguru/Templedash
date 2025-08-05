import { create } from "zustand";

interface PlayerState {
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  currentLane: number; // 0, 1, 2 for left, center, right
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

const LANE_POSITIONS = [-2.67, 0, 2.67]; // Three equal lane positions
const LANE_SWITCH_SPEED = 0.2; // Speed of lane transitions
const JUMP_FORCE = 0.3; // Jump strength
const GRAVITY = -0.8; // Gravity force
const GROUND_Y = 0;

export const usePlayer = create<PlayerState>((set, get) => ({
  position: { x: 0, y: GROUND_Y, z: 0 },
  velocity: { x: 0, y: 0, z: 0 },
  currentLane: 1, // Start in center lane
  isJumping: false,
  isMoving: false,
  isMovingLeft: false,
  isMovingRight: false,
  
  updatePosition: (delta, gameSpeed) => {
    const state = get();
    const newPosition = { ...state.position };
    const newVelocity = { ...state.velocity };
    
    // Smooth lane transition
    const targetX = LANE_POSITIONS[state.currentLane];
    const xDiff = targetX - newPosition.x;
    if (Math.abs(xDiff) > 0.1) {
      newPosition.x += xDiff * LANE_SWITCH_SPEED;
      set({ isMoving: true });
    } else {
      newPosition.x = targetX;
      set({ isMoving: false });
    }
    
    // Apply gravity and jumping
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
    
    // Update forward movement (for distance tracking)
    newPosition.z -= gameSpeed;
    
    set({ 
      position: newPosition, 
      velocity: newVelocity
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
    const newLane = Math.max(0, state.currentLane - 1);
    if (newLane !== state.currentLane) {
      set({ 
        currentLane: newLane,
        isMovingLeft: true,
        isMovingRight: false
      });
      // Reset movement flags after animation
      setTimeout(() => {
        set({ isMovingLeft: false });
      }, 300);
    }
  },
  
  moveRight: () => {
    const state = get();
    const newLane = Math.min(2, state.currentLane + 1);
    if (newLane !== state.currentLane) {
      set({ 
        currentLane: newLane,
        isMovingLeft: false,
        isMovingRight: true
      });
      // Reset movement flags after animation
      setTimeout(() => {
        set({ isMovingRight: false });
      }, 300);
    }
  },
  
  resetPlayer: () => {
    set({
      position: { x: 0, y: GROUND_Y, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      currentLane: 1,
      isJumping: false,
      isMoving: false,
      isMovingLeft: false,
      isMovingRight: false
    });
  }
}));
