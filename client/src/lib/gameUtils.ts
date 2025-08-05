import * as THREE from "three";

// Enhanced collision detection utility that considers jumping and obstacle types
export function checkCollisions(
  playerPosition: { x: number; y: number; z: number },
  objects: THREE.Object3D[],
  type: 'obstacle' | 'coin',
  isJumping?: boolean
): THREE.Object3D | null {
  const playerBox = new THREE.Box3().setFromCenterAndSize(
    new THREE.Vector3(playerPosition.x, playerPosition.y + 1, playerPosition.z),
    new THREE.Vector3(1, 2, 0.5) // Player dimensions
  );

  for (const object of objects) {
    if (!object.userData.type || object.userData.type !== type) continue;
    
    // Skip if object is too far away
    if (Math.abs(object.position.z - playerPosition.z) > 2) continue;
    
    let objectSize: THREE.Vector3;
    if (type === 'obstacle') {
      const obstacleType = object.userData.obstacleType;
      
      // If jumping and it's a rock, allow pass-through
      if (isJumping && obstacleType === 'rock') {
        continue; // Skip collision for rocks when jumping
      }
      
      // Trees and crates always cause collision regardless of jumping
      if (obstacleType === 'tree') {
        objectSize = new THREE.Vector3(1, 3, 1); // Tall tree collision
      } else {
        objectSize = new THREE.Vector3(1, 1, 1); // Standard obstacle
      }
    } else {
      objectSize = new THREE.Vector3(0.6, 0.6, 0.2);
    }
    
    const objectBox = new THREE.Box3().setFromCenterAndSize(
      object.position,
      objectSize
    );

    if (playerBox.intersectsBox(objectBox)) {
      return object;
    }
  }

  return null;
}

// Game speed progression - 5x slower with gradual increase
export function updateGameSpeed(elapsedTime: number): number {
  const baseSpeed = 0.02; // Reduced from 0.1 to 0.02 (5x slower)
  const speedIncrease = Math.floor(elapsedTime / 15) * 0.004; // Gradual increase every 15 seconds
  return Math.min(baseSpeed + speedIncrease, 0.06); // Cap at 0.06 (5x slower than 0.3)
}

// Alternative gradual speed calculation for game constants
export const GAME_CONSTANTS = {
  INITIAL_SPEED: 0.02, // 5x slower base speed
  MAX_SPEED: 0.06, // 5x slower max speed
  SPEED_INCREASE_RATE: 0.001, // How much speed increases per distance unit
  SPEED_INCREASE_INTERVAL: 100, // Distance interval for speed increases
};

// Random position generation
export function getRandomLanePosition(): number {
  const lanes = [-6, -2, 2, 6]; // Four lanes
  return lanes[Math.floor(Math.random() * lanes.length)];
}

// Score calculation
export function calculateScore(distance: number, coins: number): number {
  return Math.floor(distance * 10) + (coins * 10);
}

// Distance formatting
export function formatDistance(distance: number): string {
  if (distance < 1000) {
    return `${Math.floor(distance)}m`;
  } else {
    return `${(distance / 1000).toFixed(1)}km`;
  }
}

// Audio utilities
export function preloadAudio(src: string): HTMLAudioElement {
  const audio = new Audio(src);
  audio.preload = 'auto';
  return audio;
}

// Local storage utilities for game data
export function saveGameData(key: string, data: any): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save game data:", error);
  }
}

export function loadGameData(key: string): any {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Failed to load game data:", error);
    return null;
  }
}

// Reward tier calculation
export function getRewardTier(): { amount: number; rarity: string } {
  const random = Math.random();
  
  if (random < 0.001) { // 0.1%
    return { amount: 10, rarity: 'legendary' };
  } else if (random < 0.2) { // 19.9%
    return { amount: 0.1, rarity: 'rare' };
  } else { // 80%
    return { amount: 0.01, rarity: 'common' };
  }
}
