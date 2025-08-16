import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import * as THREE from "three";

export default function VisualEffects() {
  const { gl, scene, camera } = useThree();

  useEffect(() => {
    // Enable shadow map for better quality shadows
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap; // Soft shadows for better quality
    
    // Enable tone mapping for better HDR color reproduction
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.0;
    
    // Enable gamma correction for accurate color display
    gl.outputColorSpace = THREE.SRGBColorSpace;
    
    // Enable fog for atmospheric depth on mobile-friendly settings
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (!isMobile) {
      // Only add fog on desktop for performance
      scene.fog = new THREE.Fog(0x87CEEB, 50, 200);
    }
    
    return () => {
      // Cleanup
      scene.fog = null;
    };
  }, [gl, scene]);

  return null;
}