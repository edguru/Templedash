import { useMemo, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

interface ObstacleProps {
  gameSpeed: number;
}

interface ObstacleData {
  id: number;
  position: [number, number, number];
  type: 'crate' | 'rock';
  scale: [number, number, number];
}

export default function Obstacles({ gameSpeed }: ObstacleProps) {
  const groupRef = useRef<THREE.Group>(null);
  const woodTexture = useTexture("/textures/wood.jpg");
  
  // Generate obstacles
  const obstacles = useMemo<ObstacleData[]>(() => {
    const obstacleArray: ObstacleData[] = [];
    
    for (let i = 0; i < 20; i++) {
      const z = -20 - (i * 10); // Space obstacles 10 units apart
      const x = (Math.random() - 0.5) * 16; // Random x position within bounds
      const type: 'crate' | 'rock' = Math.random() > 0.5 ? 'crate' : 'rock';
      
      obstacleArray.push({
        id: i,
        position: [x, type === 'crate' ? 0.5 : 0.8, z],
        type,
        scale: type === 'crate' ? [1, 1, 1] : [1.5, 1.5, 1.5]
      });
    }
    
    return obstacleArray;
  }, []);

  // Move obstacles toward player
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child, index) => {
        child.position.z += gameSpeed;
        
        // Reset obstacle position when it passes the player
        if (child.position.z > 15) {
          child.position.z = -200 - (index * 10);
          child.position.x = (Math.random() - 0.5) * 16;
        }
      });
    }
  });

  return (
    <group ref={groupRef}>
      {obstacles.map((obstacle) => (
        <mesh
          key={obstacle.id}
          position={obstacle.position}
          scale={obstacle.scale}
          castShadow
          userData={{ type: 'obstacle' }}
        >
          {obstacle.type === 'crate' ? (
            <>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial 
                map={woodTexture}
                color="#8B4513"
              />
            </>
          ) : (
            <>
              <dodecahedronGeometry args={[0.8]} />
              <meshStandardMaterial color="#666666" />
            </>
          )}
        </mesh>
      ))}
    </group>
  );
}
