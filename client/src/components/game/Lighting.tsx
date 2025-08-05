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
      {/* Ambient light for overall scene brightness - increased for mobile */}
      <ambientLight intensity={0.6} color="#ffffff" />
      
      {/* Main directional light (sun) - no shadows for mobile performance */}
      <directionalLight
        ref={dirLightRef}
        position={[10, 20, 10]}
        intensity={1.2}
        color="#ffffff"
      />
    </>
  );
}
