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

// Enhanced physics constants for better gameplay feel
const LANE_POSITIONS = [-2.67, 0, 2.67]; // Three equal lane positions
const LANE_SWITCH_SPEED = 0.18; // Enhanced lane transitions for smoother movement
const JUMP_FORCE = 0.85; // Optimized to reliably clear obstacles with better arc
const GRAVITY = -1.1; // Enhanced gravity for more responsive jumping feel
const MOVEMENT_SMOOTHING = 0.85; // Smoothing factor for more fluid animations
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
    // Enhanced lane switching with smooth interpolation
    const targetX = LANE_POSITIONS[state.currentLane];
    const xDiff = targetX - newPosition.x;
    const deadZone = 0.05; // Smaller dead zone for more precise positioning
    
    if (Math.abs(xDiff) > deadZone) {
      // Use exponential smoothing for more fluid movement
      const smoothingFactor = MOVEMENT_SMOOTHING;
      const moveAmount = xDiff * LANE_SWITCH_SPEED * smoothingFactor;
      newPosition.x += moveAmount;
      set({ isMoving: true });
    } else {
      // Snap to exact position for precision
      newPosition.x = targetX;
      set({ isMoving: false });
    }
    
    // Enhanced gravity and jumping physics with better collision handling
    if (newPosition.y > GROUND_Y || newVelocity.y !== 0) {
      // Apply gravity with improved physics curve
      newVelocity.y += GRAVITY * delta;
      newPosition.y += newVelocity.y * delta;
      
      // Enhanced ground collision with soft landing
      if (newPosition.y <= GROUND_Y) {
        newPosition.y = GROUND_Y;
        
        // Add landing impact based on fall velocity for better feedback
        const landingImpact = Math.abs(newVelocity.y);
        if (landingImpact > 0.5) {
          console.log('🦵 Landing impact:', landingImpact.toFixed(2));
        }
        
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
      console.log('🦘 Enhanced JUMP with force:', JUMP_FORCE);
      set({ 
        velocity: { ...state.velocity, y: JUMP_FORCE },
        isJumping: true 
      });
    }
  },
  
  moveLeft: () => {
    const state = get();
    console.log('🔵 MOVE LEFT: Current lane', state.currentLane, '→', state.currentLane === 0 ? 'BLOCKED (already leftmost)' : `lane ${state.currentLane - 1}`);
    const newLane = Math.max(0, state.currentLane - 1);
    if (newLane !== state.currentLane) {
      set({ 
        currentLane: newLane,
        isMovingLeft: true,
        isMovingRight: false
      });
      // Reset movement flags after enhanced animation
      setTimeout(() => {
        set({ isMovingLeft: false });
      }, 250);
    }
  },
  
  moveRight: () => {
    const state = get();
    console.log('🔴 MOVE RIGHT: Current lane', state.currentLane, '→', state.currentLane === 2 ? 'BLOCKED (already rightmost)' : `lane ${state.currentLane + 1}`);
    const newLane = Math.min(2, state.currentLane + 1);
    if (newLane !== state.currentLane) {
      set({ 
        currentLane: newLane,
        isMovingLeft: false,
        isMovingRight: true
      });
      // Reset movement flags after enhanced animation
      setTimeout(() => {
        set({ isMovingRight: false });
      }, 250);
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
