import { useMemo, useRef, forwardRef, useImperativeHandle, Suspense } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { useTexture, useGLTF } from "@react-three/drei";
import * as THREE from "three";

// Preload enhanced obstacle models with PBR materials
useGLTF.preload('/assets/obstacles/enhanced_barrier.glb');
useGLTF.preload('/assets/obstacles/enhanced_roadblock.glb');
useGLTF.preload('/assets/obstacles/enhanced_cone.glb');

interface ObstacleProps {
  gameSpeed: number;
}

interface ObstacleData {
  id: number;
  position: [number, number, number];
  type: 'barrier' | 'roadblock' | 'cone';
  scale: [number, number, number];
}

const Obstacles = forwardRef<THREE.Group, ObstacleProps>(({ gameSpeed }, ref) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useImperativeHandle(ref, () => groupRef.current!);
  
  // Enhanced Obstacle Model Loader Component
  const EnhancedObstacleModel = ({ obstacleType }: { obstacleType: 'barrier' | 'roadblock' | 'cone' }) => {
    const modelPath = obstacleType === 'barrier' 
      ? '/assets/obstacles/enhanced_barrier.glb'
      : obstacleType === 'roadblock' 
      ? '/assets/obstacles/enhanced_roadblock.glb'
      : '/assets/obstacles/enhanced_cone.glb';
    
    try {
      const gltf = useGLTF(modelPath);
      
      console.log('✅ Enhanced obstacle loaded:', modelPath);
      
      // Optimize the loaded model for performance
      if (gltf.scene) {
        gltf.scene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.frustumCulled = true;
            
            // Preserve and enhance PBR materials from Tripo
            if (child.material) {
              const material = child.material as THREE.MeshStandardMaterial;
              
              // Optimize textures for performance while preserving quality
              if (material.map) {
                material.map.generateMipmaps = true;
                material.map.minFilter = THREE.LinearMipmapLinearFilter;
                material.map.magFilter = THREE.LinearFilter;
              }
              
              // Enhance metallic properties based on obstacle type
              if (obstacleType === 'barrier') {
                if (!material.metalnessMap) material.metalness = 0.8; // Very metallic barrier
                if (!material.roughnessMap) material.roughness = 0.3; // Smooth metal
              } else if (obstacleType === 'roadblock') {
                if (!material.metalnessMap) material.metalness = 0.1; // Concrete
                if (!material.roughnessMap) material.roughness = 0.9; // Rough concrete
              } else {
                if (!material.metalnessMap) material.metalness = 0.6; // Reflective cone
                if (!material.roughnessMap) material.roughness = 0.4; // Semi-glossy
              }
              
              material.needsUpdate = true;
            }
          }
        });
      }
      
      return (
        <Suspense fallback={
          <mesh castShadow>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#666666" metalness={0.5} roughness={0.5} />
          </mesh>
        }>
          <primitive 
            object={gltf.scene.clone()}
            castShadow
            receiveShadow
          />
        </Suspense>
      );
    } catch (error) {
      console.error('Error loading obstacle model:', modelPath, error);
      // Fallback to basic geometry
      return (
        <mesh castShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial 
            color={obstacleType === 'barrier' ? '#666666' : obstacleType === 'roadblock' ? '#888888' : '#FF6600'}
            metalness={obstacleType === 'barrier' ? 0.8 : 0.1}
            roughness={obstacleType === 'barrier' ? 0.3 : 0.7}
          />
        </mesh>
      );
    }
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
      const types: ('barrier' | 'roadblock' | 'cone')[] = ['barrier', 'roadblock', 'cone'];
      const type = types[Math.floor(Math.random() * types.length)];
      
      // Calculate proper Y position based on obstacle type and terrain
      const obstacleHeight = type === 'barrier' ? 0.8 : type === 'roadblock' ? 0.6 : 0.4;
      const yPosition = terrainY + obstacleHeight;
      
      obstacleArray.push({
        id: i,
        position: [x, yPosition, z],
        type,
        scale: type === 'barrier' ? [1.2, 1.0, 0.8] : type === 'roadblock' ? [1.0, 0.8, 1.0] : [0.8, 0.8, 0.8]
      });
    }
    
    // Add some larger barriers that block lanes (non-jumpable)
    for (let i = 0; i < 10; i++) {
      const z = -40 - (i * 25);
      const laneIndex = Math.floor(Math.random() * lanes.length);
      const x = lanes[laneIndex];
      
      obstacleArray.push({
        id: 100 + i,
        position: [x, 1.5, z],
        type: 'barrier',
        scale: [1.5, 2.0, 1.0] // Large barriers that can't be jumped over
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
        <mesh
          key={obstacle.id}
          position={obstacle.position}
          scale={obstacle.scale}
          castShadow
          userData={{ type: 'obstacle', obstacleType: obstacle.type }}
        >
          <EnhancedObstacleModel obstacleType={obstacle.type} />
        </mesh>
      ))}
    </group>
  );
});

export default Obstacles;
