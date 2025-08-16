import { useRef, useEffect, useState, Suspense } from "react";
import { useFrame } from "@react-three/fiber";
import { useKeyboardControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";

// Preload all enhanced character models with PBR materials
useGLTF.preload('/assets/characters/enhanced_shadow_character.glb');
useGLTF.preload('/assets/characters/enhanced_character_red.glb');
useGLTF.preload('/assets/characters/enhanced_character_blue.glb');
// Keep fallback models for compatibility
useGLTF.preload('/assets/characters/shadow_character.glb');
useGLTF.preload('/assets/characters/character_red.glb');
useGLTF.preload('/assets/characters/character_blue.glb');
useGLTF.preload('/assets/characters/character_green.glb');

// Import stores
import { usePlayer } from "../../lib/stores/usePlayer";
import { useNFT } from "../../lib/stores/useNFT";
import { useAudio } from "../../lib/stores/useAudio";
import { useTouchControls } from "../../hooks/use-touch-controls";

// Import character loader
import CharacterLoader, { FallbackCharacter } from "./CharacterLoader";
import OptimizedCharacterLoader from "./OptimizedCharacterLoader";

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

  // Enhanced character loading with high-quality PBR models
  const CharacterModel = () => {
    const modelPath = !hasCharacterNFT 
      ? '/assets/characters/enhanced_shadow_character.glb'
      : currentCharacterType === 'ninja_warrior' ? '/assets/characters/enhanced_character_red.glb'
      : currentCharacterType === 'space_ranger' ? '/assets/characters/enhanced_character_blue.glb'
      : currentCharacterType === 'crystal_mage' ? '/assets/characters/enhanced_character_red.glb'
      : '/assets/characters/enhanced_character_red.glb';
    
    console.log('🎯 Loading character model:', modelPath, 'type:', currentCharacterType, 'hasNFT:', hasCharacterNFT);

    return (
      <Suspense fallback={
        <EnhancedFallbackCharacter 
          hasCharacterNFT={hasCharacterNFT}
          characterType={currentCharacterType}
          getCharacterColor={getCharacterColor}
          groupRef={groupRef}
          meshRef={meshRef}
        />
      }>
        <OptimizedCharacterLoader 
          modelPath={modelPath} 
          characterType={currentCharacterType}
          hasCharacterNFT={hasCharacterNFT}
          groupRef={groupRef}
          meshRef={meshRef}
        />
      </Suspense>
    );
  };

  // High-performance GLB loader with PBR material support
  const OptimizedGLBLoader = ({ modelPath, characterType }: { modelPath: string, characterType: string }) => {
    try {
      const gltf = useGLTF(modelPath);
      
      console.log('✅ High-quality GLB loaded successfully:', modelPath, gltf.scene);
      
      useEffect(() => {
        if (gltf.scene) {
          // Clone the scene to avoid reference issues
          const clonedScene = gltf.scene.clone();
          
          clonedScene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              child.frustumCulled = true;
              
              // Preserve original PBR materials from Tripo
              if (child.material) {
                const material = child.material as THREE.MeshStandardMaterial;
                
                // Keep original textures for high quality but optimize for performance
                if (material.map) {
                  material.map.generateMipmaps = true;
                  material.map.minFilter = THREE.LinearMipmapLinearFilter;
                  material.map.magFilter = THREE.LinearFilter;
                }
                
                // Enhance metallic and roughness properties for better PBR
                if (!material.metalnessMap) {
                  material.metalness = hasCharacterNFT ? 0.4 : 0.2;
                }
                if (!material.roughnessMap) {
                  material.roughness = hasCharacterNFT ? 0.5 : 0.7;
                }
                
                // Add subtle emissive glow for character distinction
                const characterEmissive = {
                  'ninja_warrior': 0x220000, // Red glow
                  'space_ranger': 0x000022,  // Blue glow
                  'crystal_mage': 0x220022,  // Purple glow
                  'shadow': 0x111111         // Neutral glow
                };
                
                material.emissive.setHex(characterEmissive[characterType as keyof typeof characterEmissive] || characterEmissive.shadow);
                material.emissiveIntensity = hasCharacterNFT ? 0.1 : 0.05;
                material.needsUpdate = true;
              }
              
              console.log('🎨 PBR mesh optimized:', child.name || 'unnamed');
            }
          });
        }
      }, [gltf.scene, characterType, hasCharacterNFT]);

      return (
        <group ref={groupRef} castShadow receiveShadow>
          <group ref={meshRef}>
            <primitive 
              object={gltf.scene.clone()}
              scale={[2.5, 2.5, 2.5]}
              rotation={[0, Math.PI, 0]}
              castShadow
              receiveShadow
            />
          </group>
        </group>
      );
    } catch (error) {
      console.error('GLB loading failed, using enhanced fallback:', error);
      return (
        <EnhancedFallbackCharacter 
          hasCharacterNFT={hasCharacterNFT}
          characterType={characterType}
          getCharacterColor={getCharacterColor}
          groupRef={groupRef}
          meshRef={meshRef}
        />
      );
    }
  };

  // Enhanced fallback character with better geometry and materials
  const EnhancedFallbackCharacter = ({ hasCharacterNFT, characterType, getCharacterColor, groupRef, meshRef }: any) => {
    const characterColor = getCharacterColor();
    
    return (
      <group ref={groupRef} castShadow receiveShadow>
        <group ref={meshRef}>
          {/* Enhanced Head - more detailed sphere */}
          <mesh position={[0, 1.75, 0]} castShadow receiveShadow>
            <sphereGeometry args={[0.2, 20, 16]} />
            <meshStandardMaterial 
              color={characterColor}
              transparent={true}
              opacity={0.95}
              metalness={hasCharacterNFT ? 0.4 : 0.2}
              roughness={hasCharacterNFT ? 0.5 : 0.7}
              emissive={characterColor}
              emissiveIntensity={hasCharacterNFT ? 0.1 : 0.05}
            />
          </mesh>
          
          {/* Enhanced Body - athletic build */}
          <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.15, 0.18, 1.0, 20]} />
            <meshStandardMaterial 
              color={characterColor}
              transparent={true}
              opacity={0.95}
              metalness={hasCharacterNFT ? 0.3 : 0.1}
              roughness={hasCharacterNFT ? 0.6 : 0.8}
              emissive={characterColor}
              emissiveIntensity={hasCharacterNFT ? 0.08 : 0.03}
            />
          </mesh>
          
          {/* Enhanced Arms with better proportions */}
          <mesh position={[-0.32, 1.25, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.06, 0.06, 0.75, 16]} />
            <meshStandardMaterial 
              color={characterColor}
              metalness={hasCharacterNFT ? 0.3 : 0.1}
              roughness={hasCharacterNFT ? 0.6 : 0.8}
            />
          </mesh>
          
          <mesh position={[0.32, 1.25, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.06, 0.06, 0.75, 16]} />
            <meshStandardMaterial 
              color={characterColor}
              metalness={hasCharacterNFT ? 0.3 : 0.1}
              roughness={hasCharacterNFT ? 0.6 : 0.8}
            />
          </mesh>
          
          {/* Enhanced Legs with athletic proportions */}
          <mesh position={[-0.15, 0.35, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.07, 0.07, 0.85, 16]} />
            <meshStandardMaterial 
              color={characterColor}
              metalness={hasCharacterNFT ? 0.3 : 0.1}
              roughness={hasCharacterNFT ? 0.6 : 0.8}
            />
          </mesh>
          
          <mesh position={[0.15, 0.35, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.07, 0.07, 0.85, 16]} />
            <meshStandardMaterial 
              color={characterColor}
              metalness={hasCharacterNFT ? 0.3 : 0.1}
              roughness={hasCharacterNFT ? 0.6 : 0.8}
            />
          </mesh>
          
          {/* Character-specific details for NFT characters */}
          {hasCharacterNFT && (
            <mesh position={[0, 1.9, 0]} castShadow receiveShadow>
              <sphereGeometry args={[0.05, 12, 8]} />
              <meshStandardMaterial 
                color={characterColor}
                emissive={characterColor}
                emissiveIntensity={0.3}
                transparent={true}
                opacity={0.8}
              />
            </mesh>
          )}
        </group>
      </group>
    );
  };

  // Main component render
  return <CharacterModel />;
}
