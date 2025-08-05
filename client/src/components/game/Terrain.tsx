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
  
  // Configure texture
  grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
  grassTexture.repeat.set(10, 50);

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
          {/* Main running path */}
          <mesh 
            position={[0, -0.5, 0]} 
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow
          >
            <planeGeometry args={[8, 40]} />
            <meshStandardMaterial 
              color="#D2B48C"
              roughness={0.7}
            />
          </mesh>
          
          {/* Lane markings */}
          <mesh position={[-2.67, -0.45, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.2, 40]} />
            <meshStandardMaterial color="#8B4513" />
          </mesh>
          <mesh position={[2.67, -0.45, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.2, 40]} />
            <meshStandardMaterial color="#8B4513" />
          </mesh>
          
          {/* Side walls */}
          <mesh position={[-4.5, 0.5, 0]}>
            <boxGeometry args={[1, 1, 40]} />
            <meshStandardMaterial color="#654321" />
          </mesh>
          <mesh position={[4.5, 0.5, 0]}>
            <boxGeometry args={[1, 1, 40]} />
            <meshStandardMaterial color="#654321" />
          </mesh>
        </group>
      ))}
    </>
  );
}
