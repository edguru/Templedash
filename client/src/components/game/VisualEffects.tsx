import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import * as THREE from "three";

export default function VisualEffects() {
  const { gl, scene, camera } = useThree();

  useEffect(() => {
    // Detect device capabilities for adaptive quality
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isHighEnd = !isMobile || (window.devicePixelRatio > 2 && window.screen.width > 1080);
    
    // Enhanced shadow system with adaptive quality
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = isHighEnd ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
    gl.shadowMap.autoUpdate = true;
    
    // Adaptive shadow map size based on device
    const shadowMapSize = isMobile ? 1024 : isHighEnd ? 2048 : 1536;
    
    // Enhanced tone mapping with adaptive exposure
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = isHighEnd ? 1.2 : 1.0;
    
    // Enhanced color space and gamma correction
    gl.outputColorSpace = THREE.SRGBColorSpace;
    
    // Performance optimizations
    gl.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 2 : 3));
    
    // Enhanced atmospheric effects
    if (isHighEnd) {
      // High-end devices get enhanced fog with color variation
      const skyColor = new THREE.Color(0x87CEEB);
      const horizonColor = new THREE.Color(0xFFF8DC);
      scene.fog = new THREE.FogExp2(skyColor.getHex(), 0.008);
    } else if (!isMobile) {
      // Desktop gets basic fog
      scene.fog = new THREE.Fog(0x87CEEB, 50, 200);
    }
    
    // Enhanced lighting quality
    if (scene.children.length > 0) {
      scene.traverse((child) => {
        if (child instanceof THREE.DirectionalLight) {
          child.shadow.mapSize.width = shadowMapSize;
          child.shadow.mapSize.height = shadowMapSize;
          child.shadow.camera.near = 0.1;
          child.shadow.camera.far = 100;
          child.shadow.bias = -0.0005;
          child.shadow.normalBias = 0.02;
        }
      });
    }
    
    // Enhanced memory management and performance optimization
    if (isMobile) {
      // Reduce texture size and enable compression
      THREE.Cache.enabled = true;
      
      // Optimize renderer for mobile performance
      gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }
    
    // Reduce shadow map updates frequency for performance
    gl.shadowMap.autoUpdate = false;
    
    // Enable manual shadow map updates only when needed
    const updateShadows = () => {
      gl.shadowMap.needsUpdate = true;
    };
    
    // Update shadows less frequently
    const shadowUpdateInterval = setInterval(updateShadows, isMobile ? 100 : 50);
    
    return () => {
      clearInterval(shadowUpdateInterval);
    };
    
    console.log('🎨 Visual effects optimized for:', isMobile ? 'Mobile' : 'Desktop', 
                'Quality:', isHighEnd ? 'High' : 'Standard');
    
    // Combined cleanup moved to above return statement
  }, [gl, scene, camera]);

  return null;
}