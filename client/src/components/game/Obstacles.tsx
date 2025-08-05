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
  
  // Generate obstacles with proper terrain positioning
  const obstacles = useMemo<ObstacleData[]>(() => {
    const obstacleArray: ObstacleData[] = [];
    const lanes = [-3, -1, 1, 3]; // Four lanes within the running path
    const terrainY = -0.5; // Terrain surface level
    
    for (let i = 0; i < 25; i++) {
      const z = -20 - (i * 12); // More spaced out obstacles
      const laneIndex = Math.floor(Math.random() * lanes.length);
      const x = lanes[laneIndex]; // Snap to lanes
      const type: 'crate' | 'rock' = Math.random() > 0.6 ? 'crate' : 'rock';
      
      // Calculate proper Y position based on obstacle type and terrain
      const obstacleHeight = type === 'crate' ? 0.5 : 0.4; // Smaller obstacles
      const yPosition = terrainY + obstacleHeight;
      
      obstacleArray.push({
        id: i,
        position: [x, yPosition, z],
        type,
        scale: type === 'crate' ? [0.8, 0.8, 0.8] : [0.8, 0.8, 0.8] // Smaller scale
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
