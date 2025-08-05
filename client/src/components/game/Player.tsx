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
  const meshRef = useRef<THREE.Group>(null);
  const groupRef = useRef<THREE.Group>(null);
  const { position, velocity, isJumping, jump, moveLeft, moveRight } = usePlayer();
  const { hasCharacterNFT, characterType } = useNFT();
  const { playSuccess } = useAudio();
  const [subscribe, getState] = useKeyboardControls<Controls>();
  const [isMovingLeftState, setIsMovingLeftState] = useState(false);
  const [isMovingRightState, setIsMovingRightState] = useState(false);
  
  // Touch controls
  const { isMovingLeft, isMovingRight, isJumping: touchJumping } = useTouchControls();

  // Handle keyboard and touch input with animation states
  useFrame(({ clock }) => {
    const controls = getState();
    const time = clock.getElapsedTime();
    
    // Keyboard controls
    if (controls.left) {
      moveLeft();
      setIsMovingLeftState(true);
    } else {
      setIsMovingLeftState(false);
    }
    
    if (controls.right) {
      moveRight();
      setIsMovingRightState(true);
    } else {
      setIsMovingRightState(false);
    }
    
    if (controls.jump && !isJumping) {
      jump();
      playSuccess();
    }
    
    // Touch controls
    if (isMovingLeft) {
      moveLeft();
      setIsMovingLeftState(true);
    }
    if (isMovingRight) {
      moveRight();
      setIsMovingRightState(true);
    }
    if (touchJumping && !isJumping) {
      jump();
      playSuccess();
    }
    
    // Update animation states
    if (!isMovingLeft && !controls.left) setIsMovingLeftState(false);
    if (!isMovingRight && !controls.right) setIsMovingRightState(false);
    
    // Apply running animation to group
    if (groupRef.current && meshRef.current) {
      const runSpeed = 4; // Slower, more natural animation
      const bobAmount = Math.sin(time * runSpeed * 2) * 0.03;
      const rotateAmount = Math.sin(time * runSpeed) * 0.06;
      
      // Character positioning with proper terrain alignment
      const terrainY = -0.5;
      const characterHeight = 0.8; // Character height to match shadow character
      groupRef.current.position.set(position.x, terrainY + characterHeight, position.z);
      
      // Running animation
      if (!isJumping) {
        meshRef.current.position.y = bobAmount;
        meshRef.current.rotation.x = rotateAmount * 0.1;
      }
      
      // Leaning animation
      if (isMovingLeftState) {
        groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, 0.15, 0.1);
      } else if (isMovingRightState) {
        groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, -0.15, 0.1);
      } else {
        groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, 0, 0.1);
      }
      
      // Jumping animation
      if (isJumping) {
        meshRef.current.rotation.x = -0.2;
        meshRef.current.position.y = Math.max(bobAmount, 0.1);
      }
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

  // Character model rendering with enhanced fallback
  const CharacterModel = () => {
    if (hasCharacterNFT && characterType !== 'shadow') {
      try {
        const { scene } = useGLTF(`/assets/characters/character_${characterType}.glb`);
        return (
          <group ref={groupRef} scale={[1.2, 1.2, 1.2]} castShadow receiveShadow>
            <primitive 
              ref={meshRef}
              object={scene.clone()}
              castShadow 
              receiveShadow
            />
          </group>
        );
      } catch (error) {
        console.log(`Character model ${characterType} not found, using fallback`);
      }
    }
    
    // Enhanced shadow character or fallback with proper proportions
    return (
      <group ref={groupRef} castShadow receiveShadow>
        {/* Enhanced stick figure character */}
        <group ref={meshRef}>
          {/* Head */}
          <mesh position={[0, 1.7, 0]} castShadow>
            <sphereGeometry args={[0.12, 8, 6]} />
            <meshStandardMaterial 
              color={hasCharacterNFT ? "#4A90E2" : "#1a1a1a"} 
              transparent={!hasCharacterNFT}
              opacity={hasCharacterNFT ? 1 : 0.8}
            />
          </mesh>
          
          {/* Body */}
          <mesh position={[0, 1, 0]} castShadow>
            <cylinderGeometry args={[0.06, 0.08, 0.8, 8]} />
            <meshStandardMaterial 
              color={hasCharacterNFT ? "#4A90E2" : "#1a1a1a"} 
              transparent={!hasCharacterNFT}
              opacity={hasCharacterNFT ? 1 : 0.8}
            />
          </mesh>
          
          {/* Arms */}
          <mesh position={[-0.2, 1.2, 0]} castShadow>
            <cylinderGeometry args={[0.03, 0.03, 0.5, 6]} />
            <meshStandardMaterial 
              color={hasCharacterNFT ? "#4A90E2" : "#1a1a1a"} 
              transparent={!hasCharacterNFT}
              opacity={hasCharacterNFT ? 1 : 0.8}
            />
          </mesh>
          <mesh position={[0.2, 1.2, 0]} castShadow>
            <cylinderGeometry args={[0.03, 0.03, 0.5, 6]} />
            <meshStandardMaterial 
              color={hasCharacterNFT ? "#4A90E2" : "#1a1a1a"} 
              transparent={!hasCharacterNFT}
              opacity={hasCharacterNFT ? 1 : 0.8}
            />
          </mesh>
          
          {/* Legs */}
          <mesh position={[-0.08, 0.3, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 0.6, 6]} />
            <meshStandardMaterial 
              color={hasCharacterNFT ? "#4A90E2" : "#1a1a1a"} 
              transparent={!hasCharacterNFT}
              opacity={hasCharacterNFT ? 1 : 0.8}
            />
          </mesh>
          <mesh position={[0.08, 0.3, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 0.6, 6]} />
            <meshStandardMaterial 
              color={hasCharacterNFT ? "#4A90E2" : "#1a1a1a"} 
              transparent={!hasCharacterNFT}
              opacity={hasCharacterNFT ? 1 : 0.8}
            />
          </mesh>
        </group>
      </group>
    );
  };

  return <CharacterModel />;
}
