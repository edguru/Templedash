import { useMemo, useRef, forwardRef, useImperativeHandle, Suspense } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { useTexture, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { GLTF } from "three-stdlib";

interface ObstacleProps {
  gameSpeed: number;
}

interface ObstacleData {
  id: number;
  position: [number, number, number];
  type: 'crate' | 'rock' | 'tree';
  scale: [number, number, number];
}

// Preload all obstacle models
useGLTF.preload('/assets/obstacles/enhanced_crate.glb');
useGLTF.preload('/assets/obstacles/enhanced_rock.glb');
useGLTF.preload('/assets/obstacles/enhanced_tree.glb');

const Obstacles = forwardRef<THREE.Group, ObstacleProps>(({ gameSpeed }, ref) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useImperativeHandle(ref, () => groupRef.current!);
  
  const woodTexture = useTexture("/textures/wood.jpg");
  
  // Load high-quality GLB models
  const { scene: crateModel } = useGLTF('/assets/obstacles/enhanced_crate.glb') as GLTF & {
    scene: THREE.Group
  };
  const { scene: rockModel } = useGLTF('/assets/obstacles/enhanced_rock.glb') as GLTF & {
    scene: THREE.Group
  };
  const { scene: treeModel } = useGLTF('/assets/obstacles/enhanced_tree.glb') as GLTF & {
    scene: THREE.Group
  };
  
  // Generate obstacles with proper terrain positioning
  const obstacles = useMemo<ObstacleData[]>(() => {
    const obstacleArray: ObstacleData[] = [];
    const lanes = [-2.67, 0, 2.67]; // Three equal lanes for Temple Run
    const terrainY = -0.5; // Terrain surface level
    
    for (let i = 0; i < 30; i++) {
      const z = -15 - (i * 8); // Closer spacing for more challenge
      const laneIndex = i % 3; // Cycle through all lanes
      const x = lanes[laneIndex]; // Snap to lanes
      const type: 'crate' | 'rock' = Math.random() > 0.6 ? 'crate' : 'rock';
      
      // Calculate proper Y position based on obstacle type and terrain
      // Rocks and crates should be jumpable with improved jump mechanics
      const obstacleHeight = type === 'crate' ? 0.6 : 0.5; // Slightly higher for challenge
      const yPosition = terrainY + obstacleHeight;
      
      obstacleArray.push({
        id: i,
        position: [x, yPosition, z],
        type,
        scale: type === 'crate' ? [0.8, 0.8, 0.8] : [0.6, 0.6, 0.6] // Rocks smaller for jumping
      });
    }
    
    // Add some trees that block lanes (non-jumpable)
    for (let i = 0; i < 10; i++) {
      const z = -40 - (i * 25);
      const laneIndex = Math.floor(Math.random() * lanes.length);
      const x = lanes[laneIndex];
      
      obstacleArray.push({
        id: 100 + i,
        position: [x, 1.5, z],
        type: 'tree',
        scale: [0.8, 2.5, 0.8] // Tall trees that can't be jumped over
      });
    }
    
    return obstacleArray;
  }, []);

  // Move obstacles toward player
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child, index) => {
        child.position.z += gameSpeed;
        
        // Reset obstacle position when it passes the player - maintain lane positioning
        if (child.position.z > 15) {
          child.position.z = -200 - (index * 10);
          const lanes = [-2.67, 0, 2.67];
          child.position.x = lanes[Math.floor(Math.random() * lanes.length)];
        }
      });
    }
  });

  return (
    <group ref={groupRef}>
      {obstacles.map((obstacle) => (
        <group
          key={obstacle.id}
          position={obstacle.position}
          scale={obstacle.scale}
          userData={{ type: 'obstacle', obstacleType: obstacle.type }}
        >
          <Suspense fallback={
            <mesh castShadow receiveShadow>
              {obstacle.type === 'crate' ? (
                <>
                  <boxGeometry args={[1, 1, 1]} />
                  <meshStandardMaterial color="#8B4513" />
                </>
              ) : obstacle.type === 'rock' ? (
                <>
                  <sphereGeometry args={[0.5, 8, 8]} />
                  <meshStandardMaterial color="#555555" />
                </>
              ) : (
                <>
                  <cylinderGeometry args={[0.3, 0.5, 2, 8]} />
                  <meshStandardMaterial color="#654321" />
                </>
              )}
            </mesh>
          }>
            {obstacle.type === 'crate' && crateModel ? (
              <primitive 
                object={crateModel.clone()} 
                castShadow 
                receiveShadow 
                scale={[2.5, 2.5, 2.5]}
              />
            ) : obstacle.type === 'rock' && rockModel ? (
              <primitive 
                object={rockModel.clone()} 
                castShadow 
                receiveShadow 
                scale={[2.5, 2.5, 2.5]}
              />
            ) : obstacle.type === 'tree' && treeModel ? (
              <primitive 
                object={treeModel.clone()} 
                castShadow 
                receiveShadow 
                scale={[2.5, 2.5, 2.5]}
              />
            ) : (
              // Fallback to geometric shapes if models fail to load
              <mesh castShadow receiveShadow>
                {obstacle.type === 'crate' ? (
                  <>
                    <boxGeometry args={[1, 1, 1]} />
                    <meshStandardMaterial 
                      map={woodTexture}
                      color="#8B4513"
                      roughness={0.85}
                      metalness={0.0}
                    />
                  </>
                ) : obstacle.type === 'rock' ? (
                  <>
                    <sphereGeometry args={[0.5, 16, 16]} />
                    <meshStandardMaterial 
                      color="#555555"
                      roughness={0.95}
                      metalness={0.1}
                    />
                  </>
                ) : (
                  <>
                    <cylinderGeometry args={[0.3, 0.5, 2, 16]} />
                    <meshStandardMaterial 
                      color="#654321"
                      roughness={0.8}
                      metalness={0.0}
                    />
                  </>
                )}
              </mesh>
            )}
          </Suspense>
        </group>
      ))}
    </group>
  );
});

export default Obstacles;
