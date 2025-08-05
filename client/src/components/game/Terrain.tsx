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
      {/* Main ground plane */}
      <mesh 
        ref={meshRef}
        position={[0, -1, 0]} 
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[20, 100]} />
        <meshLambertMaterial 
          map={grassTexture}
          color="#8B4513"
        />
      </mesh>
      
      {/* Side walls - optimized with forest green */}
      <mesh position={[-10, 2, 0]}>
        <boxGeometry args={[1, 6, 100]} />
        <meshLambertMaterial color="#4A5D23" />
      </mesh>
      
      <mesh position={[10, 2, 0]}>
        <boxGeometry args={[1, 6, 100]} />
        <meshLambertMaterial color="#4A5D23" />
      </mesh>
    </>
  );
}
