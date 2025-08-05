import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Mesh } from 'three';
import * as THREE from 'three';

interface ShadowCharacterProps {
  position: [number, number, number];
  isJumping: boolean;
  isMovingLeft: boolean;
  isMovingRight: boolean;
}

export default function ShadowCharacter({ position, isJumping, isMovingLeft, isMovingRight }: ShadowCharacterProps) {
  const groupRef = useRef<Group>(null);
  const headRef = useRef<Mesh>(null);
  const bodyRef = useRef<Mesh>(null);
  const leftArmRef = useRef<Mesh>(null);
  const rightArmRef = useRef<Mesh>(null);
  const leftLegRef = useRef<Mesh>(null);
  const rightLegRef = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;

    const time = clock.getElapsedTime();
    
    // Running animation
    if (!isJumping) {
      const runSpeed = 8;
      const armSwing = Math.sin(time * runSpeed) * 0.5;
      const legSwing = Math.sin(time * runSpeed) * 0.8;
      
      // Animate arms
      if (leftArmRef.current) leftArmRef.current.rotation.x = armSwing;
      if (rightArmRef.current) rightArmRef.current.rotation.x = -armSwing;
      
      // Animate legs
      if (leftLegRef.current) leftLegRef.current.rotation.x = legSwing;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -legSwing;
      
      // Body bob
      if (bodyRef.current) bodyRef.current.position.y = Math.sin(time * runSpeed * 2) * 0.05;
    }

    // Leaning animation
    if (isMovingLeft) {
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, 0.2, 0.1);
    } else if (isMovingRight) {
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, -0.2, 0.1);
    } else {
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, 0, 0.1);
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Shadow material for all parts */}
      <meshLambertMaterial attach="material" color="#1a1a1a" transparent opacity={0.8} />
      
      {/* Head */}
      <mesh ref={headRef} position={[0, 1.7, 0]}>
        <sphereGeometry args={[0.15, 8, 6]} />
        <meshLambertMaterial color="#1a1a1a" transparent opacity={0.8} />
      </mesh>
      
      {/* Body */}
      <mesh ref={bodyRef} position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.12, 0.15, 0.6, 8]} />
        <meshLambertMaterial color="#1a1a1a" transparent opacity={0.8} />
      </mesh>
      
      {/* Left Arm */}
      <group position={[-0.2, 1.4, 0]}>
        <mesh ref={leftArmRef} position={[0, -0.15, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.3, 6]} />
          <meshLambertMaterial color="#1a1a1a" transparent opacity={0.8} />
        </mesh>
      </group>
      
      {/* Right Arm */}
      <group position={[0.2, 1.4, 0]}>
        <mesh ref={rightArmRef} position={[0, -0.15, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.3, 6]} />
          <meshLambertMaterial color="#1a1a1a" transparent opacity={0.8} />
        </mesh>
      </group>
      
      {/* Left Leg */}
      <group position={[-0.08, 0.9, 0]}>
        <mesh ref={leftLegRef} position={[0, -0.2, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.4, 6]} />
          <meshLambertMaterial color="#1a1a1a" transparent opacity={0.8} />
        </mesh>
      </group>
      
      {/* Right Leg */}
      <group position={[0.08, 0.9, 0]}>
        <mesh ref={rightLegRef} position={[0, -0.2, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.4, 6]} />
          <meshLambertMaterial color="#1a1a1a" transparent opacity={0.8} />
        </mesh>
      </group>
    </group>
  );
}