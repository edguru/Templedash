import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Mesh } from "three";
import * as THREE from "three";

interface CoinClusterProps {
  positions: [number, number, number][];
  onCollect: (index: number) => void;
  collectedCoins: Set<number>;
}

export default function CoinCluster({ positions, onCollect, collectedCoins }: CoinClusterProps) {
  const coinRefs = useRef<(Mesh | null)[]>([]);

  useFrame((state) => {
    coinRefs.current.forEach((coin, index) => {
      if (coin && !collectedCoins.has(index)) {
        // Floating animation - offset each coin slightly
        coin.position.y = positions[index][1] + Math.sin(state.clock.elapsedTime * 3 + index * 0.5) * 0.15;
        // Rotation animation
        coin.rotation.y += 0.05;
        coin.rotation.x = Math.sin(state.clock.elapsedTime * 2 + index * 0.3) * 0.1;
      }
    });
  });

  return (
    <group>
      {positions.map((position, index) => {
        if (collectedCoins.has(index)) return null;
        
        return (
          <mesh
            key={index}
            ref={(el) => (coinRefs.current[index] = el)}
            position={position}
            onClick={() => onCollect(index)}
          >
            <cylinderGeometry args={[0.3, 0.3, 0.1, 8]} />
            <meshLambertMaterial color="#FFD700" />
            
            {/* Glowing rim effect */}
            <mesh scale={1.1}>
              <cylinderGeometry args={[0.3, 0.3, 0.05, 8]} />
              <meshBasicMaterial color="#FFEF94" transparent opacity={0.4} />
            </mesh>
          </mesh>
        );
      })}
    </group>
  );
}