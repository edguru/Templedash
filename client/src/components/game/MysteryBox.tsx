import { useRef, useState, useEffect, Suspense } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { Mesh } from "three";
import * as THREE from "three";

// Preload enhanced mystery box model
useGLTF.preload('/assets/boxes/enhanced_mystery_box.glb');

interface MysteryBoxProps {
  position: [number, number, number];
  onCollect: () => void;
}

export default function MysteryBox({ position, onCollect }: MysteryBoxProps) {
  const meshRef = useRef<Mesh>(null);
  const [collected, setCollected] = useState(false);
  
  // Enhanced Mystery Box Model Component
  const EnhancedMysteryBoxModel = () => {
    try {
      const gltf = useGLTF('/assets/boxes/enhanced_mystery_box.glb');
      
      // Optimize the mystery box model
      if (gltf.scene) {
        gltf.scene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            
            if (child.material) {
              const material = child.material as THREE.MeshStandardMaterial;
              
              // Enhance treasure chest materials
              if (material.name?.includes('wood') || material.color.r > 0.5) {
                // Wood parts
                if (!material.metalnessMap) material.metalness = 0.1;
                if (!material.roughnessMap) material.roughness = 0.8;
              } else {
                // Metal parts (hinges, locks)
                if (!material.metalnessMap) material.metalness = 0.9;
                if (!material.roughnessMap) material.roughness = 0.3;
              }
              
              // Add mystical glow
              material.emissive.setHex(0x4A1A4A);
              material.emissiveIntensity = 0.2;
              
              material.needsUpdate = true;
            }
          }
        });
      }
      
      return (
        <primitive 
          object={gltf.scene.clone()}
          scale={[0.8, 0.8, 0.8]}
          castShadow
          receiveShadow
        />
      );
    } catch (error) {
      console.error('Error loading mystery box model:', error);
      // Enhanced fallback
      return (
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial 
            color="#9333EA"
            metalness={0.6}
            roughness={0.3}
            emissive="#6B46C1"
            emissiveIntensity={0.2}
          />
        </mesh>
      );
    }
  };

  useFrame((state) => {
    if (meshRef.current && !collected) {
      // Floating animation
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      // Gentle rotation
      meshRef.current.rotation.y += 0.01;
      
      // Pulsing scale effect
      const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.1;
      meshRef.current.scale.setScalar(scale);
    }
  });

  const handleClick = () => {
    if (!collected) {
      setCollected(true);
      onCollect();
    }
  };

  if (collected) return null;

  return (
    <mesh
      ref={meshRef}
      position={position}
      onClick={handleClick}
      scale={1}
      castShadow
      receiveShadow
    >
      <Suspense fallback={
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#9333EA" metalness={0.6} roughness={0.3} />
        </mesh>
      }>
        <EnhancedMysteryBoxModel />
      </Suspense>
      
      {/* Enhanced glowing effect with multiple layers */}
      <mesh scale={1.05}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial 
          color="#A855F7" 
          transparent 
          opacity={0.4}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      <mesh scale={1.15}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial 
          color="#DDD6FE" 
          transparent 
          opacity={0.2}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Enhanced sparkle particles effect */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={30}
            array={new Float32Array(Array.from({ length: 90 }, () => (Math.random() - 0.5) * 3))}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial 
          size={0.08} 
          color="#FBBF24"
          transparent
          opacity={0.8}
          sizeAttenuation={true}
        />
      </points>
    </mesh>
  );
}