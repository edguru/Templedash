import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface CoinProps {
  gameSpeed: number;
}

interface CoinData {
  id: number;
  position: [number, number, number];
  rotation: number;
}

export default function Coins({ gameSpeed }: CoinProps) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Generate coins
  const coins = useMemo<CoinData[]>(() => {
    const coinArray: CoinData[] = [];
    
    for (let i = 0; i < 30; i++) {
      const z = -15 - (i * 8); // Space coins 8 units apart
      const x = (Math.random() - 0.5) * 14; // Random x position
      const rotation = Math.random() * Math.PI * 2;
      
      coinArray.push({
        id: i,
        position: [x, 1.5, z],
        rotation
      });
    }
    
    return coinArray;
  }, []);

  // Animate coins
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child, index) => {
        // Move toward player
        child.position.z += gameSpeed;
        
        // Rotate coin
        child.rotation.y += 0.05;
        child.rotation.x = Math.sin(state.clock.elapsedTime * 2 + index) * 0.1;
        
        // Reset coin position when it passes the player
        if (child.position.z > 15) {
          child.position.z = -240 - (index * 8);
          child.position.x = (Math.random() - 0.5) * 14;
        }
      });
    }
  });

  return (
    <group ref={groupRef}>
      {coins.map((coin) => (
        <mesh
          key={coin.id}
          position={coin.position}
          rotation={[0, coin.rotation, 0]}
          userData={{ type: 'coin' }}
        >
          <cylinderGeometry args={[0.3, 0.3, 0.1, 8]} />
          <meshStandardMaterial 
            color="#FFD700"
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
      ))}
    </group>
  );
}
