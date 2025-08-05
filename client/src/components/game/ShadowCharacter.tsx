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

  useFrame(({ clock }) => {
    if (!groupRef.current) return;

    const time = clock.getElapsedTime();
    
    // Basic running animation for the whole model
    if (!isJumping && modelRef.current) {
      const runSpeed = 6;
      const bobAmount = Math.sin(time * runSpeed * 2) * 0.05;
      const rotateAmount = Math.sin(time * runSpeed) * 0.1;
      
      // Model bobbing while running
      modelRef.current.position.y = bobAmount;
      modelRef.current.rotation.x = rotateAmount * 0.2; // Slight forward lean while running
    }

    // Leaning animation for direction changes
    if (isMovingLeft) {
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, 0.15, 0.1);
    } else if (isMovingRight) {
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, -0.15, 0.1);
    } else {
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, 0, 0.1);
    }

    // Update position
    groupRef.current.position.set(position[0], position[1], position[2]);
  });

  return (
    <group ref={groupRef} scale={[2.5, 2.5, 2.5]} castShadow receiveShadow>
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