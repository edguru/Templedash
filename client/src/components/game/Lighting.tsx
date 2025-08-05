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
      {/* Ambient light for overall scene brightness */}
      <ambientLight intensity={0.4} color="#ffffff" />
      
      {/* Main directional light (sun) */}
      <directionalLight
        ref={dirLightRef}
        position={[10, 20, 10]}
        intensity={1}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      
      {/* Fill light for softer shadows */}
      <directionalLight
        position={[-5, 10, 5]}
        intensity={0.3}
        color="#87CEEB"
      />
    </>
  );
}
