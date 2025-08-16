import { useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface PerformanceManagerProps {
  gameSpeed: number;
}

export default function PerformanceManager({ gameSpeed }: PerformanceManagerProps) {
  const { gl, scene } = useThree();
  const frameCount = useRef(0);
  const lastFPSTime = useRef(performance.now());
  const currentFPS = useRef(60);
  
  // Performance monitoring and adaptive quality
  useFrame(() => {
    frameCount.current++;
    const now = performance.now();
    
    // Calculate FPS every second
    if (now - lastFPSTime.current >= 1000) {
      currentFPS.current = frameCount.current;
      frameCount.current = 0;
      lastFPSTime.current = now;
      
      // Adaptive quality based on performance
      adaptQuality(currentFPS.current);
    }
  });
  
  const adaptQuality = (fps: number) => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Aggressive performance optimization when FPS drops
    if (fps < 30) {
      console.log('📉 Low FPS detected:', fps, '- Reducing quality');
      
      // Reduce shadow quality
      gl.shadowMap.enabled = false;
      
      // Reduce particle count by disabling complex effects
      scene.traverse((child) => {
        if (child instanceof THREE.Points) {
          child.visible = false;
        }
      });
      
      // Lower texture quality
      gl.setPixelRatio(isMobile ? 1 : 1.5);
      
    } else if (fps < 45) {
      console.log('📊 Medium FPS detected:', fps, '- Optimizing');
      
      // Moderate optimizations
      gl.shadowMap.enabled = true;
      gl.shadowMap.type = THREE.BasicShadowMap;
      
      // Reduce some particle visibility
      scene.traverse((child) => {
        if (child instanceof THREE.Points) {
          child.visible = Math.random() > 0.3; // Show 70% of particles
        }
      });
      
    } else if (fps >= 50) {
      // Good performance - enable full quality
      gl.shadowMap.enabled = true;
      gl.shadowMap.type = isMobile ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
      
      scene.traverse((child) => {
        if (child instanceof THREE.Points) {
          child.visible = true;
        }
      });
    }
  };
  
  useEffect(() => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Initial performance optimizations
    if (isMobile) {
      // Mobile-specific optimizations
      gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      gl.shadowMap.type = THREE.BasicShadowMap;
      
      // Memory optimizations for mobile
      
      // GPU optimizations for mobile
    }
    
    // Memory cleanup interval
    const cleanupInterval = setInterval(() => {
      // Force garbage collection hint
      if (window.gc) {
        window.gc();
      }
      
      // Clear unused textures
      gl.dispose();
      
      console.log('🧹 Memory cleanup performed');
    }, 30000); // Every 30 seconds
    
    return () => {
      clearInterval(cleanupInterval);
    };
  }, [gl]);
  
  return null;
}