import { useRef, useEffect, useState, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Group } from 'three';
import * as THREE from 'three';
import { GLTF } from 'three-stdlib';

// Preload the stick human model
useGLTF.preload('/models/stick_human.glb');

interface ShadowCharacterProps {
  position: [number, number, number];
  isJumping: boolean;
  isMovingLeft: boolean;
  isMovingRight: boolean;
}

export default function ShadowCharacter({ position, isJumping, isMovingLeft, isMovingRight }: ShadowCharacterProps) {
  const groupRef = useRef<Group>(null);
  const modelRef = useRef<Group>(null);
  const [modelLoaded, setModelLoaded] = useState(false);

  // Load the 3D stick human model
  const { scene: stickHuman } = useGLTF('/models/stick_human.glb') as GLTF & {
    scene: THREE.Group
  };

  useEffect(() => {
    if (stickHuman) {
      setModelLoaded(true);
      console.log("Stick human model loaded successfully");
    }
  }, [stickHuman]);

  // Keyboard controls for ShadowCharacter
  useEffect(() => {
    console.log('🔧 Setting up keyboard controls in ShadowCharacter');
    
    const handleKeyDown = (e: KeyboardEvent) => {
      console.log('⌨️ ShadowCharacter key event:', e.code, e.key);
      
      if (['KeyA', 'KeyD', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        console.log('🎮 ShadowCharacter game key detected:', e.code);
        e.preventDefault();
        e.stopPropagation();
        
        if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
          console.log('🔵 ShadowCharacter EXECUTING LEFT');
          moveLeft();
        } else if (e.code === 'KeyD' || e.code === 'ArrowRight') {
          console.log('🔴 ShadowCharacter EXECUTING RIGHT');
          moveRight();
        } else if (e.code === 'Space') {
          console.log('🟢 ShadowCharacter EXECUTING JUMP');
          if (!isJumping) {
            jump();
            playSuccess();
          }
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('keydown', handleKeyDown, true);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [moveLeft, moveRight, jump, playSuccess, isJumping]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;

    const time = clock.getElapsedTime();
    
    // Enhanced running animation with proper positioning
    if (!isJumping && modelRef.current) {
      const runSpeed = 4; // Slower, more natural running animation
      const bobAmount = Math.sin(time * runSpeed * 2) * 0.04; // Subtle bobbing
      const rotateAmount = Math.sin(time * runSpeed) * 0.08;
      const armSwing = Math.sin(time * runSpeed) * 0.15;
      
      // Model bobbing while running
      modelRef.current.position.y = bobAmount;
      modelRef.current.rotation.x = rotateAmount * 0.15; // Forward lean while running
      
      // Simulate arm swinging by rotating the whole upper body slightly
      modelRef.current.rotation.y = armSwing * 0.1;
    }

    // Smoother leaning animation for direction changes
    if (isMovingLeft) {
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, 0.2, 0.15);
    } else if (isMovingRight) {
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, -0.2, 0.15);
    } else {
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, 0, 0.15);
    }

    // Jumping animation
    if (isJumping && modelRef.current) {
      modelRef.current.rotation.x = -0.3; // Lean back while jumping
      modelRef.current.position.y = 0.2; // Stay elevated
    }

    // Update position with proper terrain alignment
    const terrainY = -0.5; // Terrain surface level
    const characterHeight = 0.8; // Character height to place feet on ground
    groupRef.current.position.set(position[0], terrainY + characterHeight, position[2]);
  });

  return (
    <group ref={groupRef} scale={[1.2, 1.2, 1.2]} rotation={[0, Math.PI, 0]} castShadow receiveShadow>
      {modelLoaded && stickHuman ? (
        <Suspense fallback={
          <mesh castShadow>
            <boxGeometry args={[0.5, 2, 0.5]} />
            <meshStandardMaterial color="#2a2a2a" />
          </mesh>
        }>
          <group ref={modelRef}>
            <primitive 
              object={stickHuman.clone()} 
              castShadow 
              receiveShadow 
              scale={[1, 1, 1]}
              position={[0, 0, 0]}
            />
          </group>
        </Suspense>
      ) : (
        // Fallback stick figure if model doesn't load
        <group>
          {/* Head */}
          <mesh position={[0, 1.7, 0]} castShadow>
            <sphereGeometry args={[0.15, 8, 6]} />
            <meshStandardMaterial color="#2a2a2a" />
          </mesh>
          
          {/* Body */}
          <mesh position={[0, 1, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.12, 0.8, 8]} />
            <meshStandardMaterial color="#2a2a2a" />
          </mesh>
          
          {/* Left Arm */}
          <mesh position={[-0.25, 1.2, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 0.6, 6]} />
            <meshStandardMaterial color="#2a2a2a" />
          </mesh>
          
          {/* Right Arm */}
          <mesh position={[0.25, 1.2, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 0.6, 6]} />
            <meshStandardMaterial color="#2a2a2a" />
          </mesh>
          
          {/* Left Leg */}
          <mesh position={[-0.12, 0.3, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.05, 0.7, 6]} />
            <meshStandardMaterial color="#2a2a2a" />
          </mesh>
          
          {/* Right Leg */}
          <mesh position={[0.12, 0.3, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.05, 0.7, 6]} />
            <meshStandardMaterial color="#2a2a2a" />
          </mesh>
        </group>
      )}
    </group>
  );
}