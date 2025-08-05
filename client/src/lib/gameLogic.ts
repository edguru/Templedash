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
  COIN_SPAWN_DISTANCE_MIN: 40, // doubled
  COIN_SPAWN_DISTANCE_MAX: 60, // doubled
  
  // Mystery Box settings - Much rarer (500 morning runs)
  MYSTERY_BOX_HEIGHT_OFFSET: 1.2,
  MYSTERY_BOX_SIZE: 1,
  MYSTERY_BOX_DISTANCE_MIN: 5000, // Much higher distance requirement
  MYSTERY_BOX_DISTANCE_MAX: 6000, // Spawn only after very long runs
  MYSTERY_BOX_COIN_TRIGGER: 500, // Increased from 300 to 500 runs worth
  MYSTERY_BOX_COOLDOWN: 10 * 60 * 1000, // 10 minutes cooldown
  
  // Player movement
  INITIAL_SPEED: 0.1, // meters/second (reduced by 50x)
  SPEED_INCREASE_INTERVAL: 30, // seconds
  SPEED_INCREASE_AMOUNT: 0.004, // reduced by 50x
  MAX_SPEED: 0.2, // reduced by 50x
  JUMP_HEIGHT: 2.5,
  JUMP_DURATION: 0.6,
  
  // Mystery Box Rewards (exact distribution for $500 among 10,000 players)
  MYSTERY_BOX_REWARDS: [
    { amount: 10, chance: 0.001 },     // 0.1% → $10 (10 players)  
    { amount: 1, chance: 0.01 },       // 1% → $1 (100 players)
    { amount: 0.1, chance: 0.04 },     // 4% → $0.10 (400 players)
    { amount: 0.05, chance: 0.10 },    // 10% → $0.05 (1000 players)
    { amount: 0.01, chance: 0.25 },    // 25% → $0.01 (2500 players)
    { amount: 0.005, chance: 0.30 },   // 30% → $0.005 (3000 players)
    { amount: 0.001, chance: 0.299 },  // 29.9% → $0.001 (2990 players)
  ]
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
  
  // Check distance trigger - much stricter
  const distanceSinceLastBox = gameState.distance - gameState.lastMysteryBoxSpawn;
  const distanceCondition = distanceSinceLastBox >= GAME_CONSTANTS.MYSTERY_BOX_DISTANCE_MIN && 
                           Math.random() < 0.05; // Only 5% chance even when distance met
  
  // Check coin trigger - requires 500 runs equivalent
  const coinCondition = gameState.coinsCollected >= GAME_CONSTANTS.MYSTERY_BOX_COIN_TRIGGER;
  
  return distanceCondition || coinCondition;
}

// Check if coin cluster should spawn
export function shouldSpawnCoinCluster(gameState: GameState): boolean {
  const distanceSinceLastCluster = gameState.distance - gameState.lastCoinClusterSpawn;
  return distanceSinceLastCluster >= GAME_CONSTANTS.COIN_SPAWN_DISTANCE_MIN;
}

// Generate mystery box reward using weighted probabilities
export function generateMysteryBoxReward(): { amount: number; rarity: string } {
  let random = Math.random();
  let cumulative = 0;
  
  for (const reward of GAME_CONSTANTS.MYSTERY_BOX_REWARDS) {
    cumulative += reward.chance;
    if (random < cumulative) {
      // Determine rarity based on amount
      let rarity = 'common';
      if (reward.amount >= 10) rarity = 'legendary';
      else if (reward.amount >= 1) rarity = 'epic';
      else if (reward.amount >= 0.1) rarity = 'rare';
      else if (reward.amount >= 0.05) rarity = 'uncommon';
      
      return { amount: reward.amount, rarity };
    }
  }
  
  // Fallback (should never reach here)
  return { amount: 0.001, rarity: 'common' };
}