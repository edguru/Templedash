import { useFrame } from "@react-three/fiber";
import { useRef, useEffect, useState } from "react";
import * as THREE from "three";

// Import game components
import Player from "./Player";
import Terrain from "./Terrain";
import Obstacles from "./Obstacles";
import Coins from "./Coins";
import Environment from "./Environment";
import SimpleEnvironment from "./SimpleEnvironment";
import Lighting from "./Lighting";
import MysteryBox from "./MysteryBox";
import CoinCluster from "./CoinCluster";
import ShadowCharacter from "./ShadowCharacter";
import LODManager from "./LODManager";
import CoinAnimation from "./CoinAnimation";
import VisualEffects from "./VisualEffects";
import ParticleEffects from "./ParticleEffects";
import PerformanceManager from "./PerformanceManager";


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
import { useNFT } from "../../lib/stores/useNFT";

// Import game utilities
import { checkCollisions, updateGameSpeed, GAME_CONSTANTS as SPEED_CONSTANTS } from "../../lib/gameUtils";

export default function GameScene() {
  const { gamePhase, endGame, addScore, distance, updateDistance } = useGameState();
  const { position, velocity, isJumping, updatePosition, resetPlayer, isMovingLeft, isMovingRight } = usePlayer();
  const { hasCharacterNFT } = useNFT();
  const { playHit, playSuccess } = useAudio();
  const { addCoins, addTokenReward } = useRewards();
  
  // Enhanced game state
  const [gameState, setGameState] = useState<GameState>({
    distance: 0,
    speed: SPEED_CONSTANTS.INITIAL_SPEED,
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
  const [coinAnimations, setCoinAnimations] = useState<Array<{
    id: string;
    startPosition: [number, number, number];
    targetPosition: [number, number, number];
  }>>([]);
  
  const gameSpeed = useRef(SPEED_CONSTANTS.INITIAL_SPEED);
  const terrainOffset = useRef(0);
  const obstaclesRef = useRef<THREE.Group>(null);
  const coinsRef = useRef<THREE.Group>(null);

  // Enhanced game loop with precise mechanics
  useFrame((state, delta) => {
    if (gamePhase !== 'playing') return;

    // Calculate gradual speed increase (5x slower than original)
    const elapsedTime = (Date.now() - gameState.gameStartTime) / 1000; // seconds
    const currentSpeed = updateGameSpeed(elapsedTime);
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
    
    // Update global distance state for UI
    updateDistance(Math.floor(newDistance));
    
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
    
    // Check collisions with obstacles - enhanced with jumping consideration
    if (obstaclesRef.current) {
      const collision = checkCollisions(
        { x: position.x, y: position.y, z: position.z },
        obstaclesRef.current.children,
        'obstacle',
        isJumping
      );
      
      if (collision) {
        playHit();
        endGame();
        return;
      }
    }
    
    // Check coin collection from legacy coins with animation
    if (coinsRef.current) {
      const coinHit = checkCollisions(
        { x: position.x, y: position.y, z: position.z },
        coinsRef.current.children,
        'coin'
      );
      
      if (coinHit) {
        // Create coin animation to top-right corner
        const coinId = `coin_${Date.now()}_${Math.random()}`;
        setCoinAnimations(prev => [...prev, {
          id: coinId,
          startPosition: [coinHit.position.x, coinHit.position.y, coinHit.position.z],
          targetPosition: [6, 8, position.z] // Top-right corner of screen
        }]);
        
        coinsRef.current.remove(coinHit);
        addScore(10);
        addCoins(1);
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
    
    // Dynamic camera positioning - adjust during jumps
    const cameraHeight = isJumping ? 6 : 5; // Higher camera when jumping
    const cameraDistance = isJumping ? 10 : 8; // Further back when jumping
    state.camera.position.set(position.x * 0.1, cameraHeight, position.z + cameraDistance);
    state.camera.lookAt(position.x, position.y + 1, position.z - 2);
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

  // Handle mystery box collection with proper API call
  const handleMysteryBoxCollection = async (boxId: string) => {
    try {
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
      
      // Make API call to claim reward with authentication
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/tokens/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          amount: reward.amount,
          reason: 'mystery_box'
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Mystery reward claimed successfully:', data);
        addTokenReward(reward.amount);
        playSuccess();
      } else {
        console.error('Failed to claim mystery reward:', response.statusText);
      }
    } catch (error) {
      console.error('Error claiming mystery reward:', error);
    }
  };

  // Reset game state when starting new game
  useEffect(() => {
    if (gamePhase === 'playing') {
      resetPlayer();
      terrainOffset.current = 0;
      gameSpeed.current = SPEED_CONSTANTS.INITIAL_SPEED;
      setGameState({
        distance: 0,
        speed: SPEED_CONSTANTS.INITIAL_SPEED,
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
      setCoinAnimations([]);
      
      // Reset global distance state
      updateDistance(0);
    }
  }, [gamePhase, resetPlayer, updateDistance]);

  return (
    <>
      <VisualEffects />
      <PerformanceManager gameSpeed={gameSpeed.current} />
      <SimpleEnvironment />
      <Lighting />
      
      {/* Enhanced particle effects for better visual feedback */}
      <ParticleEffects gameSpeed={gameSpeed.current} playerPosition={position} />
      
      {/* Use Shadow Character as default, Player component if NFT owned */}
      {hasCharacterNFT ? (
        <Player />
      ) : (
        <ShadowCharacter 
          position={[position.x, position.y + 0.5, position.z]}
          isJumping={isJumping}
          isMovingLeft={isMovingLeft || false}
          isMovingRight={isMovingRight || false}
        />
      )}
      
      <LODManager position={[0, 0, 0]} distances={[50, 100, 200]}>
        <Terrain offset={terrainOffset} />
      </LODManager>
      
      <Obstacles ref={obstaclesRef} gameSpeed={gameSpeed.current} />
      <Coins ref={coinsRef} gameSpeed={gameSpeed.current} />
      
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
      
      {/* Coin collection animations */}
      {coinAnimations.map(animation => (
        <CoinAnimation
          key={animation.id}
          startPosition={animation.startPosition}
          targetPosition={animation.targetPosition}
          onComplete={() => {
            setCoinAnimations(prev => prev.filter(a => a.id !== animation.id));
          }}
        />
      ))}

      {/* <Environment gameSpeed={gameSpeed.current} /> */}
    </>
  );
}
