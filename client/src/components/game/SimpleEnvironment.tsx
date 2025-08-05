import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function SimpleEnvironment() {
  const cloudsRef = useRef<THREE.Group>(null);

  // Create some simple floating elements for atmosphere
  useFrame(({ clock }) => {
    if (cloudsRef.current) {
      cloudsRef.current.children.forEach((cloud, index) => {
        cloud.position.x = Math.sin(clock.elapsedTime * 0.1 + index) * 30;
        cloud.position.z = -50 + Math.sin(clock.elapsedTime * 0.05 + index) * 20;
      });
    }
  });

  return (
    <group ref={cloudsRef}>
      {/* Simple cloud-like shapes in the distance */}
      {Array.from({ length: 8 }, (_, i) => (
        <mesh
          key={i}
          position={[
            (Math.random() - 0.5) * 60,
            15 + Math.random() * 10,
            -80 - Math.random() * 40
          ]}
          scale={[2 + Math.random() * 3, 1 + Math.random(), 2 + Math.random() * 3]}
        >
          <sphereGeometry args={[3, 8, 6]} />
          <meshBasicMaterial 
            color="#ffffff" 
            transparent 
            opacity={0.6} 
          />
        </mesh>
      ))}
      
      {/* Distant hills */}
      {Array.from({ length: 5 }, (_, i) => (
        <mesh
          key={`hill-${i}`}
          position={[
            (i - 2) * 25,
            -2,
            -100 - Math.random() * 50
          ]}
          scale={[15, 8 + Math.random() * 5, 10]}
        >
          <sphereGeometry args={[1, 8, 6]} />
          <meshLambertMaterial color="#2D5A27" />
        </mesh>
      ))}
    </group>
  );
}