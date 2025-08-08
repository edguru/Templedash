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
  jump = 'jump',
  start = 'start',
  restart = 'restart'
}

export default function Player() {
  const meshRef = useRef<THREE.Group>(null);
  const groupRef = useRef<THREE.Group>(null);
  const { position, velocity, isJumping, jump, moveLeft, moveRight, currentLane } = usePlayer();
  const { hasCharacterNFT, currentCharacterType } = useNFT();
  const { playSuccess } = useAudio();
  const [subscribe, getState] = useKeyboardControls<Controls>();
  const [isMovingLeftState, setIsMovingLeftState] = useState(false);
  const [isMovingRightState, setIsMovingRightState] = useState(false);
  
  // Touch controls
  const { isMovingLeft, isMovingRight, isJumping: touchJumping } = useTouchControls();
  
  // Track previous keyboard states for edge detection
  const [prevLeftPressed, setPrevLeftPressed] = useState(false);
  const [prevRightPressed, setPrevRightPressed] = useState(false);
  const [prevJumpPressed, setPrevJumpPressed] = useState(false);

  // Handle keyboard and touch input with animation states
  useFrame(({ clock }) => {
    const controls = getState();
    const time = clock.getElapsedTime();
    
    // No need for keyboard controls debugging since we have direct handlers
    
    // Update previous states for consistency (remove old keyboard handling)
    setPrevLeftPressed(false);
    setPrevRightPressed(false);
    setPrevJumpPressed(false);
    
    // Touch controls handled by mobile UI buttons directly - no need to handle here
    
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

  // Remove duplicate jump subscription - handled by direct keyboard events

  // Direct keyboard handling with extensive debugging
  useEffect(() => {
    console.log('🔧 Setting up keyboard controls for Player component');
    
    const handleKeyDown = (e: KeyboardEvent) => {
      console.log('⌨️ Raw key event:', e.code, e.key, 'Target:', (e.target as Element)?.tagName, 'Active:', document.activeElement?.tagName);
      
      if (['KeyA', 'KeyD', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        console.log('🎮 Game key detected:', e.code, 'Preventing default');
        e.preventDefault();
        e.stopPropagation();
        
        if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
          console.log('🔵 EXECUTING LEFT from lane:', currentLane);
          moveLeft();
        } else if (e.code === 'KeyD' || e.code === 'ArrowRight') {
          console.log('🔴 EXECUTING RIGHT from lane:', currentLane);
          moveRight();
        } else if (e.code === 'Space') {
          console.log('🟢 EXECUTING JUMP, isJumping:', isJumping);
          if (!isJumping) {
            jump();
            playSuccess();
          }
        }
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (['KeyA', 'KeyD', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        console.log('🔓 Key released:', e.code);
      }
    };
    
    // Add both keydown and keyup listeners
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    
    // Also add to document as fallback
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('keyup', handleKeyUp, true);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('keyup', handleKeyUp, true);
    };
  }, [moveLeft, moveRight, jump, playSuccess, isJumping, currentLane]);

  // Get character color based on type
  const getCharacterColor = () => {
    const characterColors = {
      'ninja_warrior': '#dc2626', // red
      'space_ranger': '#2563eb',  // blue  
      'crystal_mage': '#7c3aed',  // purple
      'shadow': '#1a1a1a'         // dark gray
    };
    return characterColors[currentCharacterType] || characterColors['shadow'];
  };

  // Character model rendering with enhanced fallback
  const CharacterModel = () => {
    if (hasCharacterNFT && currentCharacterType !== 'shadow') {
      try {
        const { scene } = useGLTF(`/assets/characters/character_${currentCharacterType}.glb`);
        return (
          <group ref={groupRef} scale={[1.2, 1.2, 1.2]} rotation={[0, Math.PI, 0]} castShadow receiveShadow>
            <primitive 
              ref={meshRef}
              object={scene.clone()}
              castShadow 
              receiveShadow
            />
          </group>
        );
      } catch (error) {
        console.log(`Character model ${currentCharacterType} not found, using fallback`);
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
              color={hasCharacterNFT ? getCharacterColor() : "#1a1a1a"} 
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
