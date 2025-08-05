import { useRef, useEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface LODManagerProps {
  children: React.ReactNode;
  distances?: [number, number, number]; // [high, medium, low] quality distances
  position: [number, number, number];
}

export default function LODManager({ 
  children, 
  distances = [10, 25, 50], 
  position 
}: LODManagerProps) {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const [lodLevel, setLodLevel] = useState(0); // 0: high, 1: medium, 2: low

  useEffect(() => {
    const updateLOD = () => {
      if (groupRef.current && camera) {
        const distance = camera.position.distanceTo(
          new THREE.Vector3(position[0], position[1], position[2])
        );
        
        let newLodLevel = 0;
        if (distance > distances[2]) {
          newLodLevel = 3; // cull
        } else if (distance > distances[1]) {
          newLodLevel = 2; // low
        } else if (distance > distances[0]) {
          newLodLevel = 1; // medium
        } else {
          newLodLevel = 0; // high
        }
        
        if (newLodLevel !== lodLevel) {
          setLodLevel(newLodLevel);
        }
      }
    };

    // Update LOD every frame (throttled)
    let lastUpdate = 0;
    const handleFrame = () => {
      const now = Date.now();
      if (now - lastUpdate > 100) { // Update every 100ms
        updateLOD();
        lastUpdate = now;
      }
      requestAnimationFrame(handleFrame);
    };
    
    const frameId = requestAnimationFrame(handleFrame);
    return () => cancelAnimationFrame(frameId);
  }, [camera, distances, lodLevel, position]);

  // Don't render if too far away
  if (lodLevel === 3) {
    return null;
  }

  const scale = lodLevel === 2 ? 0.7 : lodLevel === 1 ? 0.85 : 1;

  return (
    <group 
      ref={groupRef} 
      position={position} 
      scale={[scale, scale, scale]}
    >
      {children}
    </group>
  );
}