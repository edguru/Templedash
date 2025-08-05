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
      {/* Main soil-colored running path */}
      <mesh 
        ref={meshRef}
        position={[0, -0.5, 0]} 
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[8, 150]} />
        <meshStandardMaterial 
          color="#A0824C"
          roughness={0.8}
        />
      </mesh>
      
      {/* Left forest ground - moved further away */}
      <mesh 
        position={[-20, -0.5, 0]} 
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[24, 150]} />
        <meshStandardMaterial 
          map={grassTexture}
          color="#2D4A1F"
          roughness={0.9}
        />
      </mesh>
      
      {/* Right forest ground - moved further away */}
      <mesh 
        position={[20, -0.5, 0]} 
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[24, 150]} />
        <meshStandardMaterial 
          map={grassTexture}
          color="#2D4A1F"
          roughness={0.9}
        />
      </mesh>
      
      {/* Lane dividers */}
      <mesh position={[-2.5, -0.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.1, 150]} />
        <meshStandardMaterial color="#8B6F35" />
      </mesh>
      <mesh position={[2.5, -0.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.1, 150]} />
        <meshStandardMaterial color="#8B6F35" />
      </mesh>
      
      {/* Side barriers/walls */}
      <mesh position={[-12, 1, 0]}>
        <boxGeometry args={[2, 3, 150]} />
        <meshStandardMaterial color="#654321" />
      </mesh>
      <mesh position={[12, 1, 0]}>
        <boxGeometry args={[2, 3, 150]} />
        <meshStandardMaterial color="#654321" />
      </mesh>
    </>
  );
}
