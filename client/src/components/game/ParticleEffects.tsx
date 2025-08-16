import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface ParticleEffectsProps {
  gameSpeed: number;
  playerPosition: { x: number; y: number; z: number };
}

export default function ParticleEffects({ gameSpeed, playerPosition }: ParticleEffectsProps) {
  const dustParticlesRef = useRef<THREE.Points>(null);
  const sparkleParticlesRef = useRef<THREE.Points>(null);
  
  // Optimized dust particles for running effect with reduced count
  const dustParticles = useMemo(() => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const count = isMobile ? 50 : 100; // Reduce particle count on mobile
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Position particles behind the player
      positions[i3] = (Math.random() - 0.5) * 6; // x
      positions[i3 + 1] = Math.random() * 0.5; // y
      positions[i3 + 2] = Math.random() * -20 - 5; // z
      
      // Random velocities for natural movement
      velocities[i3] = (Math.random() - 0.5) * 0.02;
      velocities[i3 + 1] = Math.random() * 0.01;
      velocities[i3 + 2] = Math.random() * 0.05 + 0.02;
      
      // Varying sizes for depth
      sizes[i] = Math.random() * 0.03 + 0.01;
    }
    
    return { positions, velocities, sizes, count };
  }, []);
  
  // Optimized sparkle particles for magical effects with mobile consideration
  const sparkleParticles = useMemo(() => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const count = isMobile ? 30 : 60; // Significantly reduce on mobile
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Random positions around the scene
      positions[i3] = (Math.random() - 0.5) * 12;
      positions[i3 + 1] = Math.random() * 4 + 0.5;
      positions[i3 + 2] = Math.random() * -30 - 10;
      
      // Golden sparkle colors with variation
      const intensity = 0.7 + Math.random() * 0.3;
      colors[i3] = intensity; // r
      colors[i3 + 1] = intensity * 0.8; // g
      colors[i3 + 2] = intensity * 0.2; // b
      
      sizes[i] = Math.random() * 0.05 + 0.02;
    }
    
    return { positions, colors, sizes, count };
  }, []);
  
  // Animate particles
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    // Animate dust particles
    if (dustParticlesRef.current) {
      const positions = dustParticlesRef.current.geometry.attributes.position.array as Float32Array;
      const sizes = dustParticlesRef.current.geometry.attributes.size.array as Float32Array;
      
      for (let i = 0; i < dustParticles.count; i++) {
        const i3 = i * 3;
        
        // Move particles with game flow
        positions[i3 + 2] += gameSpeed;
        
        // Add natural drift
        positions[i3] += Math.sin(time + i) * 0.001;
        positions[i3 + 1] += Math.cos(time * 2 + i) * 0.001;
        
        // Fade out particles as they move away
        const distance = Math.abs(positions[i3 + 2]);
        sizes[i] = Math.max(0, dustParticles.sizes[i] * (1 - distance / 30));
        
        // Reset particles that have moved too far
        if (positions[i3 + 2] > 10) {
          positions[i3] = (Math.random() - 0.5) * 6;
          positions[i3 + 1] = Math.random() * 0.5;
          positions[i3 + 2] = Math.random() * -10 - 20;
          sizes[i] = dustParticles.sizes[i];
        }
      }
      
      dustParticlesRef.current.geometry.attributes.position.needsUpdate = true;
      dustParticlesRef.current.geometry.attributes.size.needsUpdate = true;
    }
    
    // Animate sparkle particles
    if (sparkleParticlesRef.current) {
      const positions = sparkleParticlesRef.current.geometry.attributes.position.array as Float32Array;
      const sizes = sparkleParticlesRef.current.geometry.attributes.size.array as Float32Array;
      
      for (let i = 0; i < sparkleParticles.count; i++) {
        const i3 = i * 3;
        
        // Gentle floating animation
        positions[i3 + 1] = sparkleParticles.positions[i3 + 1] + Math.sin(time * 2 + i * 0.5) * 0.3;
        
        // Twinkling effect
        const twinkle = Math.sin(time * 5 + i) * 0.5 + 0.5;
        sizes[i] = sparkleParticles.sizes[i] * (0.5 + twinkle * 0.5);
        
        // Move with game speed
        positions[i3 + 2] += gameSpeed;
        
        // Reset when too far
        if (positions[i3 + 2] > 15) {
          positions[i3] = (Math.random() - 0.5) * 12;
          positions[i3 + 1] = Math.random() * 4 + 0.5;
          positions[i3 + 2] = Math.random() * -20 - 30;
        }
      }
      
      sparkleParticlesRef.current.geometry.attributes.position.needsUpdate = true;
      sparkleParticlesRef.current.geometry.attributes.size.needsUpdate = true;
    }
  });
  
  return (
    <group>
      {/* Dust particles for running effect */}
      <points ref={dustParticlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={dustParticles.count}
            array={dustParticles.positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-size"
            count={dustParticles.count}
            array={dustParticles.sizes}
            itemSize={1}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#D2B48C"
          size={0.02}
          transparent={true}
          opacity={0.6}
          sizeAttenuation={true}
          vertexColors={false}
        />
      </points>
      
      {/* Sparkle particles for magical atmosphere */}
      <points ref={sparkleParticlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={sparkleParticles.count}
            array={sparkleParticles.positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={sparkleParticles.count}
            array={sparkleParticles.colors}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-size"
            count={sparkleParticles.count}
            array={sparkleParticles.sizes}
            itemSize={1}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.03}
          transparent={true}
          opacity={0.8}
          sizeAttenuation={true}
          vertexColors={true}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}