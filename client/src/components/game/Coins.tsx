import { useMemo, useRef, forwardRef, useImperativeHandle, Suspense } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

// Preload enhanced coin model
useGLTF.preload('/assets/coins/enhanced_coin.glb');

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
  
  // Enhanced Coin Model Component
  const EnhancedCoinModel = () => {
    try {
      const gltf = useGLTF('/assets/coins/enhanced_coin.glb');
      
      // Optimize the coin model for performance
      if (gltf.scene) {
        gltf.scene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = false; // Coins don't need to receive shadows
            
            if (child.material) {
              const material = child.material as THREE.MeshStandardMaterial;
              
              // Enhance golden metallic properties
              if (!material.metalnessMap) material.metalness = 0.9; // Very metallic
              if (!material.roughnessMap) material.roughness = 0.1; // Very smooth/shiny
              
              // Golden color enhancement
              material.color.setHex(0xFFD700); // Pure gold color
              material.emissive.setHex(0x332200); // Subtle warm glow
              material.emissiveIntensity = 0.1;
              
              material.needsUpdate = true;
            }
          }
        });
      }
      
      return (
        <primitive 
          object={gltf.scene.clone()}
          scale={[0.3, 0.3, 0.3]}
          castShadow
        />
      );
    } catch (error) {
      console.error('Error loading coin model:', error);
      // Fallback to enhanced basic geometry
      return (
        <mesh castShadow>
          <cylinderGeometry args={[0.3, 0.3, 0.05, 16]} />
          <meshStandardMaterial 
            color="#FFD700"
            metalness={0.9}
            roughness={0.1}
            emissive="#332200"
            emissiveIntensity={0.1}
          />
        </mesh>
      );
    }
  };
  
  // Generate coins
  const coins = useMemo<CoinData[]>(() => {
    const coinArray: CoinData[] = [];
    
    for (let i = 0; i < 30; i++) {
      const z = -20 - (i * 8); // Temple Run style spacing
      const lanes = [-2.67, 0, 2.67]; // Use lane positions
      const x = lanes[Math.floor(Math.random() * lanes.length)];
      const rotation = Math.random() * Math.PI * 2;
      
      coinArray.push({
        id: i,
        position: [x, 0.5, z], // Position above terrain (-0.5 + 1.0)
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
        
        // Temple Run style floating animation
        const baseY = 0.5; // Above terrain
        const floatOffset = Math.sin(state.clock.elapsedTime * 3 + index * 0.5) * 0.2;
        child.position.y = baseY + floatOffset;
        
        // Enhanced scaling for collection feedback
        const scaleAnimation = 1 + Math.sin(state.clock.elapsedTime * 4 + index) * 0.05;
        child.scale.setScalar(scaleAnimation);
        
        // Reset coin position when it passes the player - Temple Run style
        if (child.position.z > 15) {
          child.position.z = -200 - (index * 8);
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
          <Suspense fallback={
            <mesh castShadow>
              <cylinderGeometry args={[0.35, 0.35, 0.12, 16]} />
              <meshStandardMaterial color="#FFD700" metalness={0.9} roughness={0.1} />
            </mesh>
          }>
            <EnhancedCoinModel />
          </Suspense>
        </mesh>
      ))}
    </group>
  );
});

export default Coins;
