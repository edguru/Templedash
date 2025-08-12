import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function Lighting() {
  const dirLightRef = useRef<THREE.DirectionalLight>(null);
  const shadowLightRef = useRef<THREE.DirectionalLight>(null);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    
    if (dirLightRef.current) {
      // Keep main light following the action with slight movement
      dirLightRef.current.target.position.set(0, 0, 0);
      dirLightRef.current.target.updateMatrixWorld();
      
      // Subtle sun movement for dynamic shadows
      dirLightRef.current.position.x = 12 + Math.sin(time * 0.1) * 2;
      dirLightRef.current.position.z = 20 + Math.cos(time * 0.1) * 3;
    }
    
    if (shadowLightRef.current) {
      // Enable shadow casting with adaptive quality
      shadowLightRef.current.castShadow = true;
      
      // Adaptive shadow quality based on device performance
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const shadowMapSize = isMobile ? 1024 : 2048; // Lower resolution on mobile
      
      shadowLightRef.current.shadow.mapSize.width = shadowMapSize;
      shadowLightRef.current.shadow.mapSize.height = shadowMapSize;
      shadowLightRef.current.shadow.camera.near = 0.5;
      shadowLightRef.current.shadow.camera.far = 50;
      shadowLightRef.current.shadow.camera.left = -20;
      shadowLightRef.current.shadow.camera.right = 20;
      shadowLightRef.current.shadow.camera.top = 20;
      shadowLightRef.current.shadow.camera.bottom = -20;
      
      // Improved shadow bias for better quality
      shadowLightRef.current.shadow.bias = -0.0001;
      shadowLightRef.current.shadow.normalBias = 0.02;
    }
  });

  return (
    <>
      {/* Enhanced ambient light with warm tone */}
      <ambientLight intensity={0.4} color="#f0e6d2" />
      
      {/* Main sun light with enhanced shadows */}
      <directionalLight
        ref={shadowLightRef}
        position={[12, 20, 18]}
        intensity={1.3} // Slightly increased for better contrast
        color="#fff8dc"
        castShadow
        shadow-mapSize-width={window.innerWidth < 768 ? 1024 : 2048}
        shadow-mapSize-height={window.innerWidth < 768 ? 1024 : 2048}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-bias={-0.0001}
        shadow-normalBias={0.02}
      />
      
      {/* Dynamic main directional light */}
      <directionalLight
        ref={dirLightRef}
        position={[12, 25, 20]}
        intensity={0.8}
        color="#ffffff"
      />
      
      {/* Fill light from opposite side with cooler tone */}
      <directionalLight
        position={[-10, 15, 12]}
        intensity={0.3}
        color="#e6f3ff"
      />
      
      {/* Rim light for character definition */}
      <directionalLight
        position={[0, 10, -15]}
        intensity={0.4}
        color="#fff8dc"
      />
      
      {/* Ground bounce light */}
      <directionalLight
        position={[0, -5, 5]}
        intensity={0.2}
        color="#d4a574"
      />
      
      {/* Atmospheric hemisphere light */}
      <hemisphereLight
        color="#87CEEB"
        groundColor="#8B6F35"
        intensity={0.3}
      />
    </>
  );
}
