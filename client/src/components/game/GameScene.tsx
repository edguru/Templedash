import { useFrame } from "@react-three/fiber";
import { useRef, useEffect } from "react";
import * as THREE from "three";

// Import game components
import Player from "./Player";
import Terrain from "./Terrain";
import Obstacles from "./Obstacles";
import Coins from "./Coins";
import Lighting from "./Lighting";

// Import stores
import { useGameState } from "../../lib/stores/useGameState";
import { usePlayer } from "../../lib/stores/usePlayer";
import { useAudio } from "../../lib/stores/useAudio";

// Import game utilities
import { checkCollisions, updateGameSpeed } from "../../lib/gameUtils";

export default function GameScene() {
  const { gamePhase, endGame, addScore } = useGameState();
  const { position, velocity, isJumping, updatePosition, resetPlayer } = usePlayer();
  const { playHit } = useAudio();
  
  const gameSpeed = useRef(0.1);
  const terrainOffset = useRef(0);
  const obstaclesRef = useRef<THREE.Group>(null);
  const coinsRef = useRef<THREE.Group>(null);

  // Game loop
  useFrame((state, delta) => {
    if (gamePhase !== 'playing') return;

    // Update game speed over time
    gameSpeed.current = updateGameSpeed(state.clock.elapsedTime);
    
    // Move terrain
    terrainOffset.current += gameSpeed.current;
    
    // Update player position
    updatePosition(delta, gameSpeed.current);
    
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
    
    // Check coin collection
    if (coinsRef.current) {
      const coinHit = checkCollisions(
        position,
        coinsRef.current.children,
        'coin'
      );
      
      if (coinHit) {
        // Remove collected coin
        coinsRef.current.remove(coinHit);
        addScore(10);
      }
    }
    
    // Update camera to follow player
    state.camera.position.x = position.x * 0.3;
    state.camera.position.z = 10;
    state.camera.lookAt(position.x, 2, 0);
  });

  // Reset game state when starting new game
  useEffect(() => {
    if (gamePhase === 'playing') {
      resetPlayer();
      terrainOffset.current = 0;
      gameSpeed.current = 0.1;
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
    </>
  );
}
