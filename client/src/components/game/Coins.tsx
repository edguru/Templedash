import { useMemo, useRef, forwardRef, useImperativeHandle } from "react";
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

const Coins = forwardRef<THREE.Group, CoinProps>(({ gameSpeed }, ref) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useImperativeHandle(ref, () => groupRef.current!);
  
  // Generate coins
  const coins = useMemo<CoinData[]>(() => {
    const coinArray: CoinData[] = [];
    
    for (let i = 0; i < 30; i++) {
      const z = -20 - (i * 12); // Space coins 12 units apart  
      const lanes = [-2.67, 0, 2.67]; // Use lane positions
      const x = lanes[Math.floor(Math.random() * lanes.length)];
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
          child.position.z = -240 - (index * 12);
          const lanes = [-2.67, 0, 2.67];
          child.position.x = lanes[Math.floor(Math.random() * lanes.length)];
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
});

export default Coins;
