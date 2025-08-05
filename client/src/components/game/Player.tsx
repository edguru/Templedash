import { useRef, useEffect } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { useKeyboardControls } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import * as THREE from "three";

// Import stores
import { usePlayer } from "../../lib/stores/usePlayer";
import { useNFT } from "../../lib/stores/useNFT";
import { useAudio } from "../../lib/stores/useAudio";

enum Controls {
  left = 'left',
  right = 'right',
  jump = 'jump'
}

export default function Player() {
  const meshRef = useRef<THREE.Mesh>(null);
  const { position, velocity, isJumping, jump, moveLeft, moveRight } = usePlayer();
  const { hasCharacterNFT } = useNFT();
  const { playSuccess } = useAudio();
  
  const [subscribe, getState] = useKeyboardControls<Controls>();

  // Handle keyboard input
  useFrame(() => {
    const controls = getState();
    
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

  // Render character based on NFT ownership
  if (hasCharacterNFT) {
    // Try to load character model, fallback to basic geometry
    try {
      const gltf = useLoader(GLTFLoader, "/geometries/heart.gltf");
      return (
        <primitive 
          ref={meshRef}
          object={gltf.scene.clone()}
          scale={[2, 2, 2]}
          position={[position.x, position.y, position.z]}
        />
      );
    } catch (error) {
      console.log("Character model not found, using basic geometry");
    }
  }

  // Shadow character or fallback
  return (
    <mesh 
      ref={meshRef}
      position={[position.x, position.y, position.z]}
      castShadow
    >
      <boxGeometry args={[1, 2, 0.5]} />
      <meshStandardMaterial 
        color={hasCharacterNFT ? "#4A90E2" : "#000000"} 
        transparent={!hasCharacterNFT}
        opacity={hasCharacterNFT ? 1 : 0.3}
      />
    </mesh>
  );
}
