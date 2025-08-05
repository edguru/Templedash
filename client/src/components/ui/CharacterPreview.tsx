import { useState, Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment } from '@react-three/drei';
import { useNFT } from '../../lib/stores/useNFT';
import { useGameState } from '../../lib/stores/useGameState';
import { nftService } from '../../lib/nftService';
import * as THREE from 'three';

// Character models for preview
const CHARACTER_MODELS = {
  warrior: '/models/stick_human.glb', // Using stick human as base
  mage: '/models/stick_human.glb',
  archer: '/models/stick_human.glb'
};

function PreviewCharacter({ characterType }: { characterType: string }) {
  const meshRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(CHARACTER_MODELS[characterType as keyof typeof CHARACTER_MODELS] || CHARACTER_MODELS.warrior);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <group ref={meshRef} scale={[2, 2, 2]}>
      <primitive object={scene.clone()} />
    </group>
  );
}

export default function CharacterPreview() {
  const [selectedCharacter, setSelectedCharacter] = useState('warrior');
  const [isMinting, setIsMinting] = useState(false);
  const { setHasCharacterNFT, setCharacterType, setCharacterTokenId } = useNFT();
  const { setGamePhase } = useGameState();

  const handleMint = async () => {
    setIsMinting(true);
    try {
      // Simulate minting process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Update NFT ownership
      setHasCharacterNFT(true);
      setCharacterType(selectedCharacter);
      setCharacterTokenId('1');
      
      alert(`${selectedCharacter.charAt(0).toUpperCase() + selectedCharacter.slice(1)} character minted successfully!`);
      setGamePhase('start');
      
    } catch (error) {
      console.error('Minting failed:', error);
      alert('Minting failed. Please try again.');
    } finally {
      setIsMinting(false);
    }
  };

  const handleBack = () => {
    setGamePhase('mint');
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-blue-900 via-purple-800 to-black flex flex-col items-center justify-center p-4">
      <div className="bg-black/80 backdrop-blur-sm rounded-2xl p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold text-white text-center mb-6">
          Choose Your Character
        </h2>

        {/* 3D Preview */}
        <div className="w-full h-64 bg-gray-900/50 rounded-lg mb-6 overflow-hidden">
          <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
            <Environment preset="sunset" />
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />
            <Suspense fallback={
              <mesh>
                <boxGeometry args={[1, 2, 1]} />
                <meshStandardMaterial color="#4a5568" />
              </mesh>
            }>
              <PreviewCharacter characterType={selectedCharacter} />
            </Suspense>
            <OrbitControls enableZoom={false} enablePan={false} />
          </Canvas>
        </div>

        {/* Character Selection */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {Object.keys(CHARACTER_MODELS).map((type) => (
            <button
              key={type}
              onClick={() => setSelectedCharacter(type)}
              className={`p-3 rounded-lg text-sm font-semibold transition-all ${
                selectedCharacter === type
                  ? 'bg-blue-600 text-white scale-105'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        {/* Character Info */}
        <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
          <h3 className="text-white font-semibold mb-2">
            {selectedCharacter.charAt(0).toUpperCase() + selectedCharacter.slice(1)} Stats
          </h3>
          <div className="space-y-2 text-sm text-gray-300">
            <div className="flex justify-between">
              <span>Speed:</span>
              <span className="text-blue-400">★★★☆☆</span>
            </div>
            <div className="flex justify-between">
              <span>Jump:</span>
              <span className="text-green-400">★★★★☆</span>
            </div>
            <div className="flex justify-between">
              <span>Special:</span>
              <span className="text-purple-400">Unique Animation</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={handleBack}
            className="flex-1 bg-gray-700 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleMint}
            disabled={isMinting}
            className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
              isMinting
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
            }`}
          >
            {isMinting ? 'Minting...' : 'Mint for 0.001 ETH'}
          </button>
        </div>
      </div>
    </div>
  );
}