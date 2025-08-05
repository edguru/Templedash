// Game physics and logic constants
export const GAME_CONSTANTS = {
  // Lane dimensions
  LANE_WIDTH: 2,
  TOTAL_LANES: 3,
  TOTAL_WIDTH: 6,
  
  // Character dimensions
  CHARACTER_WIDTH: 1,
  CHARACTER_HEIGHT: 2,
  
  // Obstacle dimensions
  OBSTACLE_WIDTH: 1.5,
  OBSTACLE_HEIGHT_MIN: 1.5,
  OBSTACLE_HEIGHT_MAX: 2,
  
  // Coin settings
  COIN_HEIGHT_OFFSET: 1.5,
  COIN_CLUSTER_SIZE_MIN: 3,
  COIN_CLUSTER_SIZE_MAX: 5,
  COIN_SPAWN_DISTANCE_MIN: 20,
  COIN_SPAWN_DISTANCE_MAX: 30,
  
  // Mystery Box settings
  MYSTERY_BOX_HEIGHT_OFFSET: 1.2,
  MYSTERY_BOX_SIZE: 1,
  MYSTERY_BOX_DISTANCE_MIN: 1000,
  MYSTERY_BOX_DISTANCE_MAX: 1500,
  MYSTERY_BOX_COIN_TRIGGER: 300,
  MYSTERY_BOX_COOLDOWN: 3 * 60 * 1000, // 3 minutes in milliseconds
  
  // Player movement
  INITIAL_SPEED: 5, // meters/second
  SPEED_INCREASE_INTERVAL: 30, // seconds
  SPEED_INCREASE_AMOUNT: 0.2,
  MAX_SPEED: 10,
  JUMP_HEIGHT: 2.5,
  JUMP_DURATION: 0.6,
  
  // Mystery Box Rewards (probabilities)
  MYSTERY_BOX_REWARDS: {
    LEGENDARY: { probability: 0.0001, amount: 10 }, // 0.01%
    RARE: { probability: 0.01, amount: 0.1 }, // 1%
    COMMON: { probability: 0.9899, amount: 0.01 } // 98.99%
  }
};

export interface GameState {
  distance: number;
  speed: number;
  coinsCollected: number;
  score: number;
  lastMysteryBoxSpawn: number;
  lastMysteryBoxTime: number;
  lastCoinClusterSpawn: number;
  gameStartTime: number;
  mysteryBoxActive: boolean;
}

export interface CoinCluster {
  id: string;
  positions: [number, number, number][];
  collectedCoins: Set<number>;
  spawnDistance: number;
}

export interface MysteryBoxData {
  id: string;
  position: [number, number, number];
  spawnDistance: number;
  collected: boolean;
}

// Calculate current game speed based on time elapsed
export function calculateCurrentSpeed(gameStartTime: number): number {
  const elapsedSeconds = (Date.now() - gameStartTime) / 1000;
  const speedIncreases = Math.floor(elapsedSeconds / GAME_CONSTANTS.SPEED_INCREASE_INTERVAL);
  const currentSpeed = GAME_CONSTANTS.INITIAL_SPEED + (speedIncreases * GAME_CONSTANTS.SPEED_INCREASE_AMOUNT);
  return Math.min(currentSpeed, GAME_CONSTANTS.MAX_SPEED);
}

// Generate coin cluster positions in a random lane
export function generateCoinCluster(spawnDistance: number): CoinCluster {
  const clusterSize = Math.floor(Math.random() * (GAME_CONSTANTS.COIN_CLUSTER_SIZE_MAX - GAME_CONSTANTS.COIN_CLUSTER_SIZE_MIN + 1)) + GAME_CONSTANTS.COIN_CLUSTER_SIZE_MIN;
  const lane = Math.floor(Math.random() * GAME_CONSTANTS.TOTAL_LANES);
  const laneCenter = (lane - 1) * GAME_CONSTANTS.LANE_WIDTH; // -2, 0, 2 for lanes 0, 1, 2
  
  const positions: [number, number, number][] = [];
  
  for (let i = 0; i < clusterSize; i++) {
    positions.push([
      laneCenter + (Math.random() - 0.5) * 0.8, // Slight horizontal variation within lane
      GAME_CONSTANTS.COIN_HEIGHT_OFFSET,
      -spawnDistance - i * 1.5 // Space coins along Z-axis
    ]);
  }
  
  return {
    id: `coins_${spawnDistance}_${Date.now()}`,
    positions,
    collectedCoins: new Set(),
    spawnDistance
  };
}

// Generate mystery box in center lane
export function generateMysteryBox(spawnDistance: number): MysteryBoxData {
  return {
    id: `mystery_${spawnDistance}_${Date.now()}`,
    position: [0, GAME_CONSTANTS.MYSTERY_BOX_HEIGHT_OFFSET, -spawnDistance], // Center lane
    spawnDistance,
    collected: false
  };
}

// Check if mystery box should spawn
export function shouldSpawnMysteryBox(gameState: GameState): boolean {
  const now = Date.now();
  const timeSinceLastBox = now - gameState.lastMysteryBoxTime;
  
  // Check cooldown
  if (timeSinceLastBox < GAME_CONSTANTS.MYSTERY_BOX_COOLDOWN) {
    return false;
  }
  
  // Check if already have active mystery box
  if (gameState.mysteryBoxActive) {
    return false;
  }
  
  // Check distance trigger
  const distanceSinceLastBox = gameState.distance - gameState.lastMysteryBoxSpawn;
  const distanceCondition = distanceSinceLastBox >= GAME_CONSTANTS.MYSTERY_BOX_DISTANCE_MIN && 
                           Math.random() < 0.3; // 30% chance when in distance range
  
  // Check coin trigger
  const coinCondition = gameState.coinsCollected >= GAME_CONSTANTS.MYSTERY_BOX_COIN_TRIGGER;
  
  return distanceCondition || coinCondition;
}

// Check if coin cluster should spawn
export function shouldSpawnCoinCluster(gameState: GameState): boolean {
  const distanceSinceLastCluster = gameState.distance - gameState.lastCoinClusterSpawn;
  return distanceSinceLastCluster >= GAME_CONSTANTS.COIN_SPAWN_DISTANCE_MIN;
}

// Generate mystery box reward
export function generateMysteryBoxReward(): { amount: number; rarity: string } {
  const random = Math.random();
  
  if (random < GAME_CONSTANTS.MYSTERY_BOX_REWARDS.LEGENDARY.probability) {
    return { amount: GAME_CONSTANTS.MYSTERY_BOX_REWARDS.LEGENDARY.amount, rarity: 'legendary' };
  } else if (random < GAME_CONSTANTS.MYSTERY_BOX_REWARDS.LEGENDARY.probability + GAME_CONSTANTS.MYSTERY_BOX_REWARDS.RARE.probability) {
    return { amount: GAME_CONSTANTS.MYSTERY_BOX_REWARDS.RARE.amount, rarity: 'rare' };
  } else {
    return { amount: GAME_CONSTANTS.MYSTERY_BOX_REWARDS.COMMON.amount, rarity: 'common' };
  }
}