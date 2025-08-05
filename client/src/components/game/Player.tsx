import { useRef, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useKeyboardControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";

// Import stores
import { usePlayer } from "../../lib/stores/usePlayer";
import { useNFT } from "../../lib/stores/useNFT";
import { useAudio } from "../../lib/stores/useAudio";
import { useTouchControls } from "../../hooks/use-touch-controls";

enum Controls {
  left = 'left',
  right = 'right',
  jump = 'jump'
}

export default function Player() {
  const meshRef = useRef<THREE.Mesh>(null);
  const { position, velocity, isJumping, jump, moveLeft, moveRight } = usePlayer();
  const { hasCharacterNFT, characterType } = useNFT();
  const { playSuccess } = useAudio();
  const [subscribe, getState] = useKeyboardControls<Controls>();
  
  // Touch controls
  const { isMovingLeft, isMovingRight, isJumping: touchJumping } = useTouchControls();

  // Handle keyboard and touch input
  useFrame(() => {
    const controls = getState();
    
    // Keyboard controls
    if (controls.left) {
      moveLeft();
    }
    if (controls.right) {
      moveRight();
    }
    if (controls.jump && !isJumping) {
      jump();
      playSuccess();
    }
    
    // Touch controls
    if (isMovingLeft) {
      moveLeft();
    }
    if (isMovingRight) {
      moveRight();
    }
    if (touchJumping && !isJumping) {
      jump();
      playSuccess();
    }
  });

  // Subscribe to jump key for immediate feedback
  useEffect(() => {
    return subscribe(
      state => state.jump,
      isPressed => {
        if (isPressed && !isJumping) {
          jump();
          playSuccess();
        }
      }
    );
  }, [subscribe, jump, isJumping, playSuccess]);

  // Update mesh position
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.set(position.x, position.y, position.z);
    }
  });

  // Character model rendering with fallback
  const CharacterModel = () => {
    if (hasCharacterNFT && characterType !== 'shadow') {
      try {
        const { scene } = useGLTF(`/assets/characters/character_${characterType}.glb`);
        return (
          <primitive 
            ref={meshRef}
            object={scene.clone()}
            scale={[2.5, 2.5, 2.5]}
            position={[position.x, position.y, position.z]}
          />
        );
      } catch (error) {
        console.log(`Character model ${characterType} not found, using fallback`);
      }
    }
    
    // Shadow character or fallback
    return (
      <mesh 
        ref={meshRef}
        position={[position.x, position.y, position.z]}
      >
        <boxGeometry args={[1, 2, 0.5]} />
        <meshStandardMaterial 
          color={hasCharacterNFT ? "#4A90E2" : "#000000"} 
          transparent={!hasCharacterNFT}
          opacity={hasCharacterNFT ? 1 : 0.3}
        />
      </mesh>
    );
  };

  return <CharacterModel />;
}
