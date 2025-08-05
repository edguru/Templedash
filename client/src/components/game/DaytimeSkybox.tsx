import { useRef, Suspense } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTF } from 'three-stdlib';

// Preload skybox
useGLTF.preload('/models/daytime_skybox.glb');

export default function DaytimeSkybox() {
  const skyboxRef = useRef<THREE.Group>(null);
  
  // Load skybox model
  const { scene: skyboxModel } = useGLTF('/models/daytime_skybox.glb') as GLTF & {
    scene: THREE.Group
  };

  useFrame(() => {
    // Slowly rotate skybox for dynamic feel
    if (skyboxRef.current) {
      skyboxRef.current.rotation.y += 0.0002;
    }
  });

  return (
    <Suspense fallback={
      // Fallback procedural skybox
      <mesh scale={[100, 100, 100]}>
        <sphereGeometry args={[1, 32, 16]} />
        <meshBasicMaterial 
          color="#87CEEB" 
          side={THREE.BackSide}
          fog={false}
        />
      </mesh>
    }>
      <group ref={skyboxRef} scale={[50, 50, 50]}>
        <primitive 
          object={skyboxModel.clone()} 
          scale={[1, 1, 1]}
        />
      </group>
    </Suspense>
  );
}