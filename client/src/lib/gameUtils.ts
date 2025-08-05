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
    new THREE.Vector3(0.8, 2, 0.8) // Player dimensions - tighter for better detection
  );

  for (const object of objects) {
    // Check if object has collision data
    if (!object.userData || !object.userData.type) continue;
    if (object.userData.type !== type) continue;
    
    // Distance check for collision optimization
    const distance = Math.abs(object.position.z - playerPosition.z);
    if (distance > 3) continue; // Increased range for better detection
    
    let objectSize: THREE.Vector3;
    if (type === 'obstacle') {
      const obstacleType = object.userData.obstacleType || 'rock';
      
      // If jumping and it's a rock, allow pass-through only if player is high enough
      if (isJumping && obstacleType === 'rock' && playerPosition.y > 1.2) {
        console.log("Player jumped over rock obstacle!");
        continue; // Skip collision for rocks when jumping high enough
      }
      
      // Trees are tall and cannot be jumped over
      if (obstacleType === 'tree') {
        objectSize = new THREE.Vector3(1.2, 4, 1.2); // Tall tree collision
      } else {
        objectSize = new THREE.Vector3(1, 1.2, 1); // Rock obstacle
      }
    } else {
      objectSize = new THREE.Vector3(0.8, 0.8, 0.8); // Coin collision
    }
    
    const objectBox = new THREE.Box3().setFromCenterAndSize(
      object.position,
      objectSize
    );

    if (playerBox.intersectsBox(objectBox)) {
      console.log(`Collision detected! Type: ${type}, Object: ${obstacleType || 'coin'}, Player Y: ${playerPosition.y}, Jumping: ${isJumping}`);
      return object;
    }
  }

  return null;
}

// Game speed progression - 2x faster than previous (2.5x slower than original)
export function updateGameSpeed(elapsedTime: number): number {
  const baseSpeed = 0.04; // Increased from 0.02 to 0.04 (2x faster)
  const speedIncrease = Math.floor(elapsedTime / 15) * 0.008; // Gradual increase every 15 seconds
  return Math.min(baseSpeed + speedIncrease, 0.12); // Cap at 0.12 (2x faster)
}

// Game constants with 2x speed increase
export const GAME_CONSTANTS = {
  INITIAL_SPEED: 0.04, // 2x faster base speed
  MAX_SPEED: 0.12, // 2x faster max speed
  SPEED_INCREASE_RATE: 0.002, // How much speed increases per distance unit
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
