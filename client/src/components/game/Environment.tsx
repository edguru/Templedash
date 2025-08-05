import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useTexture } from "@react-three/drei";
import * as THREE from "three";

interface EnvironmentProps {
  gameSpeed: number;
}

interface EnvironmentObject {
  id: number;
  position: [number, number, number];
  type: 'tree' | 'rock_large' | 'rock_small';
  scale: number;
  rotation: number;
}

export default function Environment({ gameSpeed }: EnvironmentProps) {
  const groupRef = useRef<THREE.Group>(null);
  const grassTexture = useTexture("/textures/grass.png");
  
  // Generate fewer environment objects for better performance
  const environmentObjects = useMemo<EnvironmentObject[]>(() => {
    const objects: EnvironmentObject[] = [];
    
    // Reduce to 15 objects for mobile performance
    for (let i = 0; i < 15; i++) {
      const z = -50 - (i * 25); // Space objects further apart
      const x = (Math.random() - 0.5) * 30; // Narrower spread
      const type: 'tree' | 'rock_large' | 'rock_small' = 
        Math.random() > 0.6 ? 'tree' : 
        Math.random() > 0.5 ? 'rock_large' : 'rock_small';
      
      objects.push({
        id: i,
        position: [x, type === 'tree' ? 0 : -0.5, z],
        type,
        scale: 0.9 + Math.random() * 0.2, // Less scale variation
        rotation: Math.random() * Math.PI * 2
      });
    }
    
    return objects;
  }, []);

  // Move environment objects
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child, index) => {
        child.position.z += gameSpeed;
        
        // Reset position when object passes the player
        if (child.position.z > 20) {
          child.position.z = -750 - (index * 15);
          child.position.x = (Math.random() - 0.5) * 40;
        }
      });
    }
  });

  const EnvironmentObject = ({ obj }: { obj: EnvironmentObject }) => {
    try {
      // Try to load the GLB model first
      const { scene } = useGLTF(`/assets/environment/${obj.type}.glb`);
      return (
        <primitive 
          object={scene.clone()}
          position={obj.position}
          scale={[obj.scale * 2.5, obj.scale * 2.5, obj.scale * 2.5]}
          rotation={[0, obj.rotation, 0]}
        />
      );
    } catch (error) {
      // Fallback to low-poly geometries for performance
      if (obj.type === 'tree') {
        return (
          <group position={obj.position} rotation={[0, obj.rotation, 0]} scale={obj.scale}>
            {/* Tree trunk - low poly */}
            <mesh position={[0, 1, 0]}>
              <cylinderGeometry args={[0.3, 0.4, 2, 6]} />
              <meshLambertMaterial color="#8B4513" />
            </mesh>
            {/* Tree foliage - low poly */}
            <mesh position={[0, 3, 0]}>
              <sphereGeometry args={[1.5, 8, 6]} />
              <meshLambertMaterial color="#228B22" />
            </mesh>
          </group>
        );
      } else if (obj.type === 'rock_large') {
        return (
          <mesh position={obj.position} rotation={[0, obj.rotation, 0]} scale={obj.scale}>
            <boxGeometry args={[1.2, 1.2, 1.2]} />
            <meshLambertMaterial color="#696969" />
          </mesh>
        );
      } else {
        return (
          <mesh position={obj.position} rotation={[0, obj.rotation, 0]} scale={obj.scale}>
            <boxGeometry args={[0.8, 0.8, 0.8]} />
            <meshLambertMaterial color="#808080" />
          </mesh>
        );
      }
    }
  };

  return null; // Temporarily disable to fix green overlay
}