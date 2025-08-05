import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function Lighting() {
  const dirLightRef = useRef<THREE.DirectionalLight>(null);

  useFrame(() => {
    if (dirLightRef.current) {
      // Keep light following the action
      dirLightRef.current.target.position.set(0, 0, 0);
      dirLightRef.current.target.updateMatrixWorld();
    }
  });

  return (
    <>
      {/* Bright ambient light for mobile visibility */}
      <ambientLight intensity={0.9} color="#ffffff" />
      
      {/* Strong main directional light (sun) */}
      <directionalLight
        ref={dirLightRef}
        position={[10, 25, 15]}
        intensity={1.5}
        color="#ffffff"
      />
      
      {/* Fill light from opposite side */}
      <directionalLight
        position={[-8, 15, 10]}
        intensity={0.8}
        color="#f0f8ff"
      />
      
      {/* Top-down light for better visibility */}
      <directionalLight
        position={[0, 30, 0]}
        intensity={0.6}
        color="#ffffff"
      />
    </>
  );
}
