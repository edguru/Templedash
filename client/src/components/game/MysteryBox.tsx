import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Mesh } from "three";
import * as THREE from "three";

interface MysteryBoxProps {
  position: [number, number, number];
  onCollect: () => void;
}

export default function MysteryBox({ position, onCollect }: MysteryBoxProps) {
  const meshRef = useRef<Mesh>(null);
  const [collected, setCollected] = useState(false);

  useFrame((state) => {
    if (meshRef.current && !collected) {
      // Floating animation
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      // Gentle rotation
      meshRef.current.rotation.y += 0.01;
      
      // Pulsing scale effect
      const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.1;
      meshRef.current.scale.setScalar(scale);
    }
  });

  const handleClick = () => {
    if (!collected) {
      setCollected(true);
      onCollect();
    }
  };

  if (collected) return null;

  return (
    <mesh
      ref={meshRef}
      position={position}
      onClick={handleClick}
      scale={1}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial 
        color="#9333EA"
        metalness={0.6}
        roughness={0.3}
        emissive="#6B46C1"
        emissiveIntensity={0.2}
      />
      
      {/* Enhanced glowing effect with multiple layers */}
      <mesh scale={1.05}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial 
          color="#A855F7" 
          transparent 
          opacity={0.4}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      <mesh scale={1.15}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial 
          color="#DDD6FE" 
          transparent 
          opacity={0.2}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Enhanced sparkle particles effect */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={30}
            array={new Float32Array(Array.from({ length: 90 }, () => (Math.random() - 0.5) * 3))}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial 
          size={0.08} 
          color="#FBBF24"
          transparent
          opacity={0.8}
          sizeAttenuation={true}
        />
      </points>
    </mesh>
  );
}