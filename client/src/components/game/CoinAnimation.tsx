import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import * as THREE from 'three';

interface CoinAnimationProps {
  startPosition: [number, number, number];
  targetPosition: [number, number, number];
  onComplete: () => void;
  duration?: number;
}

export default function CoinAnimation({ 
  startPosition, 
  targetPosition, 
  onComplete, 
  duration = 1.0 
}: CoinAnimationProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const startTime = useRef<number | null>(null);
  const startPos = useRef(new Vector3(...startPosition));
  const targetPos = useRef(new Vector3(...targetPosition));

  useFrame(({ clock }) => {
    if (!meshRef.current) return;

    if (startTime.current === null) {
      startTime.current = clock.elapsedTime;
    }

    const elapsed = clock.elapsedTime - startTime.current;
    const progress = Math.min(elapsed / duration, 1);

    // Smooth easing animation
    const easeOut = 1 - Math.pow(1 - progress, 3);
    
    // Interpolate position with arc effect
    const currentPos = new Vector3().lerpVectors(startPos.current, targetPos.current, easeOut);
    
    // Add slight arc to the animation
    currentPos.y += Math.sin(progress * Math.PI) * 2;
    
    meshRef.current.position.copy(currentPos);
    
    // Rotation for visual appeal
    meshRef.current.rotation.y = progress * Math.PI * 4;
    meshRef.current.rotation.x = progress * Math.PI * 2;
    
    // Scale animation
    const scale = 1 - progress * 0.5; // Shrink as it moves
    meshRef.current.scale.setScalar(scale);

    if (progress >= 1) {
      onComplete();
    }
  });

  return (
    <mesh ref={meshRef} position={startPosition}>
      <cylinderGeometry args={[0.3, 0.3, 0.1, 8]} />
      <meshStandardMaterial 
        color="#FFD700"
        metalness={0.8}
        roughness={0.2}
        emissive="#FFD700"
        emissiveIntensity={0.3}
      />
    </mesh>
  );
}