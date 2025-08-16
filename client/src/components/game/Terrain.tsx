import { useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

interface TerrainProps {
  offset: React.MutableRefObject<number>;
}

export default function Terrain({ offset }: TerrainProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const grassTexture = useTexture("/textures/grass.png");
  
  // Configure texture with enhanced PBR properties
  grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
  grassTexture.repeat.set(10, 50);
  grassTexture.anisotropy = 16; // Enhanced texture filtering
  grassTexture.generateMipmaps = true;

  // Create PBR material properties for terrain
  const createPBRMaterial = (baseColor: string, roughness = 0.7, metalness = 0.0) => {
    return new THREE.MeshStandardMaterial({
      color: baseColor,
      roughness,
      metalness,
      map: baseColor === "#D2B48C" ? grassTexture : null,
      envMapIntensity: 0.3, // Environmental reflection intensity
      normalScale: new THREE.Vector2(0.5, 0.5), // Subtle normal mapping effect
      aoMapIntensity: 0.8, // Ambient occlusion intensity
    });
  };

  // Update texture offset for scrolling effect
  useFrame(() => {
    if (grassTexture) {
      grassTexture.offset.y = offset.current * 0.1;
    }
  });

  return (
    <>
      {/* Multiple terrain segments for continuous ground */}
      {Array.from({ length: 10 }, (_, i) => (
        <group key={`terrain-${i}`} position={[0, 0, -i * 40]}>
          {/* Main running path with enhanced PBR */}
          <mesh 
            position={[0, -0.5, 0]} 
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow
            castShadow
          >
            <planeGeometry args={[8, 40]} />
            <primitive object={createPBRMaterial("#D2B48C", 0.8, 0.0)} />
          </mesh>
          
          {/* Enhanced lane markings with PBR */}
          <mesh position={[-2.67, -0.45, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[0.2, 40]} />
            <primitive object={createPBRMaterial("#8B4513", 0.9, 0.0)} />
          </mesh>
          <mesh position={[2.67, -0.45, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[0.2, 40]} />
            <primitive object={createPBRMaterial("#8B4513", 0.9, 0.0)} />
          </mesh>
          
          {/* Enhanced side walls with realistic materials */}
          <mesh position={[-4.5, 0.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[1, 1, 40]} />
            <primitive object={createPBRMaterial("#654321", 0.85, 0.1)} />
          </mesh>
          <mesh position={[4.5, 0.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[1, 1, 40]} />
            <primitive object={createPBRMaterial("#654321", 0.85, 0.1)} />
          </mesh>
        </group>
      ))}
    </>
  );
}
