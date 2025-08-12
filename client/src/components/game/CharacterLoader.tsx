import { useGLTF } from "@react-three/drei";
import { useEffect, useState } from "react";
import * as THREE from "three";

interface CharacterLoaderProps {
  modelPath: string;
  hasCharacterNFT: boolean;
  groupRef: React.RefObject<THREE.Group>;
  meshRef: React.RefObject<THREE.Group>;
}

export default function CharacterLoader({ modelPath, hasCharacterNFT, groupRef, meshRef }: CharacterLoaderProps) {
  console.log('CharacterLoader: Attempting to load model:', modelPath);
  
  // Try to load the GLB model with error handling
  let gltf;
  try {
    gltf = useGLTF(modelPath);
    console.log('CharacterLoader: useGLTF result:', gltf);
  } catch (error) {
    console.error('CharacterLoader: useGLTF failed:', error);
    return (
      <FallbackCharacter 
        hasCharacterNFT={hasCharacterNFT}
        getCharacterColor={() => hasCharacterNFT ? "#dc2626" : "#1a1a1a"}
        groupRef={groupRef}
        meshRef={meshRef}
      />
    );
  }
  
  if (!gltf || !gltf.scene) {
    console.log('CharacterLoader: No scene found in GLTF, using fallback');
    return (
      <FallbackCharacter 
        hasCharacterNFT={hasCharacterNFT}
        getCharacterColor={() => hasCharacterNFT ? "#dc2626" : "#1a1a1a"}
        groupRef={groupRef}
        meshRef={meshRef}
      />
    );
  }
  
  const { scene } = gltf;
  
  useEffect(() => {
    if (scene) {
      console.log('CharacterLoader: Model loaded successfully, setting up shadows:', scene);
      
      // Enable shadows and enhance materials
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          
          if (child.material) {
            child.material.needsUpdate = true;
            
            // Add subtle emissive glow for NFT characters
            if (hasCharacterNFT && 'emissive' in child.material) {
              (child.material as THREE.MeshStandardMaterial).emissive.setHex(0x222222);
              (child.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.15;
            }
          }
        }
      });
    }
  }, [scene, hasCharacterNFT]);
  
  console.log('CharacterLoader: Rendering GLB model with scene:', scene);
  
  return (
    <group ref={groupRef} castShadow receiveShadow>
      <group ref={meshRef}>
        <primitive 
          object={scene.clone()}
          scale={[2.5, 2.5, 2.5]}
          rotation={[0, Math.PI, 0]}
          castShadow
          receiveShadow
        />
      </group>
    </group>
  );
}

// Enhanced fallback character component
export function FallbackCharacter({ 
  hasCharacterNFT, 
  getCharacterColor, 
  groupRef, 
  meshRef 
}: {
  hasCharacterNFT: boolean;
  getCharacterColor: () => string;
  groupRef: React.RefObject<THREE.Group>;
  meshRef: React.RefObject<THREE.Group>;
}) {
  console.log('FallbackCharacter: Using geometric fallback');
  
  return (
    <group ref={groupRef} castShadow receiveShadow>
      <group ref={meshRef}>
        {/* Head */}
        <mesh position={[0, 1.7, 0]} castShadow receiveShadow>
          <sphereGeometry args={[0.15, 12, 8]} />
          <meshStandardMaterial 
            color={hasCharacterNFT ? getCharacterColor() : "#1a1a1a"} 
            transparent={!hasCharacterNFT}
            opacity={hasCharacterNFT ? 1 : 0.9}
            metalness={0.3}
            roughness={0.7}
          />
        </mesh>
        
        {/* Body */}
        <mesh position={[0, 1, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.08, 0.12, 0.8, 12]} />
          <meshStandardMaterial 
            color={hasCharacterNFT ? "#4A90E2" : "#1a1a1a"} 
            transparent={!hasCharacterNFT}
            opacity={hasCharacterNFT ? 1 : 0.9}
            metalness={0.2}
            roughness={0.8}
          />
        </mesh>
        
        {/* Arms */}
        <mesh position={[-0.25, 1.2, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.6, 8]} />
          <meshStandardMaterial 
            color={hasCharacterNFT ? "#4A90E2" : "#1a1a1a"} 
            transparent={!hasCharacterNFT}
            opacity={hasCharacterNFT ? 1 : 0.9}
          />
        </mesh>
        <mesh position={[0.25, 1.2, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.6, 8]} />
          <meshStandardMaterial 
            color={hasCharacterNFT ? "#4A90E2" : "#1a1a1a"} 
            transparent={!hasCharacterNFT}
            opacity={hasCharacterNFT ? 1 : 0.9}
          />
        </mesh>
        
        {/* Legs */}
        <mesh position={[-0.12, 0.3, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.7, 8]} />
          <meshStandardMaterial 
            color={hasCharacterNFT ? "#4A90E2" : "#1a1a1a"} 
            transparent={!hasCharacterNFT}
            opacity={hasCharacterNFT ? 1 : 0.9}
          />
        </mesh>
        <mesh position={[0.12, 0.3, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.7, 8]} />
          <meshStandardMaterial 
            color={hasCharacterNFT ? "#4A90E2" : "#1a1a1a"} 
            transparent={!hasCharacterNFT}
            opacity={hasCharacterNFT ? 1 : 0.9}
          />
        </mesh>
      </group>
    </group>
  );
}