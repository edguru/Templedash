import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

export default function MobileOptimizer() {
  const { gl, scene, camera } = useThree();
  
  useEffect(() => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Aggressive mobile optimizations
      console.log('📱 Mobile device detected - applying optimizations');
      
      // Renderer optimizations
      gl.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      gl.shadowMap.enabled = true;
      gl.shadowMap.type = THREE.BasicShadowMap; // Faster shadows
      gl.shadowMap.autoUpdate = false; // Manual shadow updates
      
      // Reduce precision for mobile GPU
      gl.capabilities.precision = 'mediump';
      
      // Optimize LOD settings
      const optimizeLOD = () => {
        scene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            // Reduce geometry complexity for mobile
            if (child.geometry instanceof THREE.BoxGeometry) {
              const newGeometry = new THREE.BoxGeometry(
                child.geometry.parameters.width,
                child.geometry.parameters.height,
                child.geometry.parameters.depth,
                1, 1, 1 // Reduce segments
              );
              child.geometry.dispose();
              child.geometry = newGeometry;
            } else if (child.geometry instanceof THREE.SphereGeometry) {
              const newGeometry = new THREE.SphereGeometry(
                child.geometry.parameters.radius,
                8, 6 // Reduce segments significantly
              );
              child.geometry.dispose();
              child.geometry = newGeometry;
            } else if (child.geometry instanceof THREE.CylinderGeometry) {
              const newGeometry = new THREE.CylinderGeometry(
                child.geometry.parameters.radiusTop,
                child.geometry.parameters.radiusBottom,
                child.geometry.parameters.height,
                8 // Reduce segments
              );
              child.geometry.dispose();
              child.geometry = newGeometry;
            }
            
            // Optimize materials for mobile
            if (child.material instanceof THREE.MeshStandardMaterial) {
              // Reduce material complexity
              child.material.normalMap = null;
              child.material.roughnessMap = null;
              child.material.metalnessMap = null;
              child.material.aoMap = null;
              
              // Simplify lighting calculations
              child.material.envMapIntensity = 0;
              
              child.material.needsUpdate = true;
            }
            
            // Reduce shadow quality
            child.castShadow = false; // Disable most shadows
            child.receiveShadow = false;
          }
          
          // Disable particles on low-end mobile
          if (child instanceof THREE.Points) {
            const particleCount = child.geometry.attributes.position?.count || 0;
            if (particleCount > 50) {
              child.visible = false;
            }
          }
        });
      };
      
      // Apply optimizations immediately
      optimizeLOD();
      
      // Monitor and optimize periodically
      const optimizationInterval = setInterval(() => {
        // Update shadows less frequently
        gl.shadowMap.needsUpdate = true;
        
        // Dispose unused resources
        gl.dispose();
      }, 2000);
      
      return () => {
        clearInterval(optimizationInterval);
      };
    } else {
      // Desktop optimizations
      gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      gl.shadowMap.enabled = true;
      gl.shadowMap.type = THREE.PCFSoftShadowMap;
      gl.shadowMap.autoUpdate = true;
    }
  }, [gl, scene]);
  
  return null;
}