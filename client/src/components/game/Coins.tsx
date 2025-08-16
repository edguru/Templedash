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

  // Enhanced coin animation with better visual feedback
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child, index) => {
        // Move toward player
        child.position.z += gameSpeed;
        
        // Enhanced rotation with smooth spinning
        child.rotation.y += 0.08; // Faster spin for better visibility
        child.rotation.x = Math.sin(state.clock.elapsedTime * 2.5 + index) * 0.15;
        
        // Add subtle floating animation
        const baseY = 1.5;
        const floatOffset = Math.sin(state.clock.elapsedTime * 3 + index * 0.5) * 0.1;
        child.position.y = baseY + floatOffset;
        
        // Enhanced scaling for collection feedback
        const scaleAnimation = 1 + Math.sin(state.clock.elapsedTime * 4 + index) * 0.05;
        child.scale.setScalar(scaleAnimation);
        
        // Reset coin position when it passes the player
        if (child.position.z > 15) {
          child.position.z = -240 - (index * 12);
          const lanes = [-2.67, 0, 2.67];
          child.position.x = lanes[Math.floor(Math.random() * lanes.length)];
          child.scale.setScalar(1); // Reset scale
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
          <cylinderGeometry args={[0.35, 0.35, 0.12, 16]} />
          <meshStandardMaterial 
            color="#FFD700"
            metalness={0.9}
            roughness={0.1}
            emissive="#FFD700"
            emissiveIntensity={0.15}
            transparent={true}
            opacity={0.95}
          />
        </mesh>
      ))}
    </group>
  );
});

export default Coins;
