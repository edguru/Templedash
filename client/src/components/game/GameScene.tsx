import { useFrame } from "@react-three/fiber";
import { useRef, useEffect, useState } from "react";
import * as THREE from "three";

// Import game components
import Player from "./Player";
import Terrain from "./Terrain";
import Obstacles from "./Obstacles";
import Coins from "./Coins";
import Environment from "./Environment";
import Lighting from "./Lighting";
import MysteryBox from "./MysteryBox";
import CoinCluster from "./CoinCluster";

// Import game logic
import { 
  GAME_CONSTANTS, 
  GameState, 
  CoinCluster as CoinClusterType, 
  MysteryBoxData,
  calculateCurrentSpeed,
  generateCoinCluster,
  generateMysteryBox,
  shouldSpawnMysteryBox,
  shouldSpawnCoinCluster,
  generateMysteryBoxReward
} from "../../lib/gameLogic";

// Import stores
import { useGameState } from "../../lib/stores/useGameState";
import { usePlayer } from "../../lib/stores/usePlayer";
import { useAudio } from "../../lib/stores/useAudio";
import { useRewards } from "../../lib/stores/useRewards";

// Import game utilities
import { checkCollisions, updateGameSpeed } from "../../lib/gameUtils";

export default function GameScene() {
  const { gamePhase, endGame, addScore, distance, updateDistance } = useGameState();
  const { position, velocity, isJumping, updatePosition, resetPlayer } = usePlayer();
  const { playHit, playSuccess } = useAudio();
  const { addCoins, addTokenReward } = useRewards();
  
  // Enhanced game state
  const [gameState, setGameState] = useState<GameState>({
    distance: 0,
    speed: GAME_CONSTANTS.INITIAL_SPEED,
    coinsCollected: 0,
    score: 0,
    lastMysteryBoxSpawn: 0,
    lastMysteryBoxTime: 0,
    lastCoinClusterSpawn: 0,
    gameStartTime: Date.now(),
    mysteryBoxActive: false
  });
  
  const [coinClusters, setCoinClusters] = useState<CoinClusterType[]>([]);
  const [mysteryBoxes, setMysteryBoxes] = useState<MysteryBoxData[]>([]);
  
  const gameSpeed = useRef(GAME_CONSTANTS.INITIAL_SPEED);
  const terrainOffset = useRef(0);
  const obstaclesRef = useRef<THREE.Group>(null);
  const coinsRef = useRef<THREE.Group>(null);

  // Enhanced game loop with precise mechanics
  useFrame((state, delta) => {
    if (gamePhase !== 'playing') return;

    // Calculate current speed based on game time
    const currentSpeed = calculateCurrentSpeed(gameState.gameStartTime);
    gameSpeed.current = currentSpeed;
    
    // Update distance using deltaTime physics
    const distanceIncrement = currentSpeed * delta;
    const newDistance = gameState.distance + distanceIncrement;
    
    // Update game state
    setGameState(prev => ({
      ...prev,
      distance: newDistance,
      speed: currentSpeed
    }));
    
    updateDistance(newDistance);
    
    // Move terrain
    terrainOffset.current += gameSpeed.current * delta;
    
    // Update player position
    updatePosition(delta, gameSpeed.current);
    
    // Spawn coin clusters every 20-30 meters
    if (shouldSpawnCoinCluster(gameState)) {
      const spawnDistance = newDistance + 50; // Spawn ahead of player
      const newCluster = generateCoinCluster(spawnDistance);
      setCoinClusters(prev => [...prev, newCluster]);
      setGameState(prev => ({ ...prev, lastCoinClusterSpawn: newDistance }));
    }
    
    // Spawn mystery boxes based on distance (1000-1500m) or coin trigger (300 coins)
    if (shouldSpawnMysteryBox(gameState)) {
      const spawnDistance = newDistance + 100; // Spawn ahead of player
      const newMysteryBox = generateMysteryBox(spawnDistance);
      setMysteryBoxes(prev => [...prev, newMysteryBox]);
      setGameState(prev => ({ 
        ...prev, 
        lastMysteryBoxSpawn: newDistance,
        lastMysteryBoxTime: Date.now(),
        mysteryBoxActive: true
      }));
    }
    
    // Check collisions with obstacles
    if (obstaclesRef.current) {
      const collision = checkCollisions(
        position,
        obstaclesRef.current.children,
        'obstacle'
      );
      
      if (collision) {
        playHit();
        endGame();
        return;
      }
    }
    
    // Check coin collection from legacy coins
    if (coinsRef.current) {
      const coinHit = checkCollisions(
        position,
        coinsRef.current.children,
        'coin'
      );
      
      if (coinHit) {
        coinsRef.current.remove(coinHit);
        addScore(10);
        playSuccess();
      }
    }
    
    // Remove distant coin clusters and mystery boxes
    setCoinClusters(prev => prev.filter(cluster => 
      cluster.spawnDistance > newDistance - 100
    ));
    
    setMysteryBoxes(prev => prev.filter(box => 
      !box.collected && box.spawnDistance > newDistance - 100
    ));
    
    // Update camera to follow player
    state.camera.position.x = position.x * 0.3;
    state.camera.position.z = 10;
    state.camera.lookAt(position.x, 2, 0);
  });

  // Handle coin cluster collection
  const handleCoinCollection = (clusterId: string, coinIndex: number) => {
    setCoinClusters(prev => 
      prev.map(cluster => 
        cluster.id === clusterId 
          ? { ...cluster, collectedCoins: new Set([...Array.from(cluster.collectedCoins), coinIndex]) }
          : cluster
      )
    );
    
    setGameState(prev => ({ ...prev, coinsCollected: prev.coinsCollected + 1 }));
    addScore(10);
    addCoins(1);
    playSuccess();
  };

  // Handle mystery box collection
  const handleMysteryBoxCollection = (boxId: string) => {
    const reward = generateMysteryBoxReward();
    
    setMysteryBoxes(prev => 
      prev.map(box => 
        box.id === boxId ? { ...box, collected: true } : box
      )
    );
    
    setGameState(prev => ({ 
      ...prev, 
      mysteryBoxActive: false,
      coinsCollected: 0 // Reset coin counter after mystery box
    }));
    
    addTokenReward(reward.amount);
    playSuccess();
  };

  // Reset game state when starting new game
  useEffect(() => {
    if (gamePhase === 'playing') {
      resetPlayer();
      terrainOffset.current = 0;
      gameSpeed.current = GAME_CONSTANTS.INITIAL_SPEED;
      setGameState({
        distance: 0,
        speed: GAME_CONSTANTS.INITIAL_SPEED,
        coinsCollected: 0,
        score: 0,
        lastMysteryBoxSpawn: 0,
        lastMysteryBoxTime: 0,
        lastCoinClusterSpawn: 0,
        gameStartTime: Date.now(),
        mysteryBoxActive: false
      });
      setCoinClusters([]);
      setMysteryBoxes([]);
    }
  }, [gamePhase, resetPlayer]);

  return (
    <>
      <Lighting />
      
      <Player />
      
      <Terrain offset={terrainOffset} />
      
      <group ref={obstaclesRef}>
        <Obstacles gameSpeed={gameSpeed.current} />
      </group>
      
      <group ref={coinsRef}>
        <Coins gameSpeed={gameSpeed.current} />
      </group>
      
      {/* Enhanced coin clusters */}
      {coinClusters.map(cluster => (
        <CoinCluster
          key={cluster.id}
          positions={cluster.positions}
          onCollect={(coinIndex) => handleCoinCollection(cluster.id, coinIndex)}
          collectedCoins={cluster.collectedCoins}
        />
      ))}
      
      {/* Mystery boxes */}
      {mysteryBoxes.map(box => 
        !box.collected && (
          <MysteryBox
            key={box.id}
            position={box.position}
            onCollect={() => handleMysteryBoxCollection(box.id)}
          />
        )
      )}
      
      <Environment gameSpeed={gameSpeed.current} />
    </>
  );
}
