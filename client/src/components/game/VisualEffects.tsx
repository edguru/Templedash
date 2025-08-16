import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import * as THREE from "three";

export default function VisualEffects() {
  const { gl, scene, camera } = useThree();

  useEffect(() => {
    // Enhanced shadow mapping for PBR materials
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
    gl.shadowMap.autoUpdate = true;
    
    // Enhanced tone mapping for realistic PBR rendering
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.2; // Slightly increased for better contrast
    
    // Color space management for accurate PBR colors
    gl.outputColorSpace = THREE.SRGBColorSpace;
    
    // Enhanced renderer settings for PBR quality
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Enhanced visual quality settings
    if (!isMobile) {
      // Desktop enhancements
      scene.fog = new THREE.Fog(0x87CEEB, 60, 250);
    }
    
    // Enhanced environment settings for PBR
    scene.environment = null; // Will be set by lighting if needed
    
    return () => {
      scene.fog = null;
      scene.environment = null;
    };
  }, [gl, scene]);

  return null;
}