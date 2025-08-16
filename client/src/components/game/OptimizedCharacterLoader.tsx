import { Suspense, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

interface OptimizedCharacterLoaderProps {
  modelPath: string;
  characterType: string;
  hasCharacterNFT: boolean;
  groupRef: React.RefObject<THREE.Group>;
  meshRef: React.RefObject<THREE.Group>;
}

export default function OptimizedCharacterLoader({ 
  modelPath, 
  characterType, 
  hasCharacterNFT,
  groupRef,
  meshRef 
}: OptimizedCharacterLoaderProps) {
  
  const GLBLoader = () => {
    const gltf = useGLTF(modelPath);
    
    console.log('✅ High-quality GLB loaded:', modelPath);
    
    useEffect(() => {
      if (gltf.scene) {
        // Optimize the loaded model
        gltf.scene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.frustumCulled = true;
            
            // Preserve and enhance PBR materials
            if (child.material) {
              const material = child.material as THREE.MeshStandardMaterial;
              
              // Optimize textures for performance
              if (material.map) {
                material.map.generateMipmaps = true;
                material.map.minFilter = THREE.LinearMipmapLinearFilter;
                material.map.magFilter = THREE.LinearFilter;
                material.map.flipY = false; // Optimize for GLB format
              }
              
              // Enhance metallic properties for high-quality look
              if (!material.metalnessMap) {
                material.metalness = hasCharacterNFT ? 0.6 : 0.3;
              }
              
              if (!material.roughnessMap) {
                material.roughness = hasCharacterNFT ? 0.4 : 0.6;
              }
              
              // Character-specific enhancements
              const characterEnhancements = {
                'ninja_warrior': { emissive: 0x330000, intensity: 0.1 },
                'space_ranger': { emissive: 0x000033, intensity: 0.1 },
                'crystal_mage': { emissive: 0x330033, intensity: 0.1 },
                'shadow': { emissive: 0x222222, intensity: 0.05 }
              };
              
              const enhancement = characterEnhancements[characterType as keyof typeof characterEnhancements] || characterEnhancements.shadow;
              material.emissive.setHex(enhancement.emissive);
              material.emissiveIntensity = enhancement.intensity;
              
              material.needsUpdate = true;
            }
          }
        });
      }
    }, [gltf.scene]);
    
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
  };
  
  return (
    <Suspense fallback={null}>
      <GLBLoader />
    </Suspense>
  );
}