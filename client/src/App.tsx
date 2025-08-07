import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useState } from "react";
import { KeyboardControls } from "@react-three/drei";
import { ThirdwebProvider } from 'thirdweb/react';
import { useActiveAccount } from 'thirdweb/react';
import { client, baseCampTestnet } from './lib/thirdweb';
import "@fontsource/inter";

// Import game components
import GameScene from "./components/game/GameScene";
import GameUI from "./components/ui/GameUI";
import StartScreen from "./components/ui/StartScreen";
import GameOverScreen from "./components/ui/GameOverScreen";
import MintScreen from "./components/ui/MintScreen";
import MysteryBoxScreen from "./components/ui/MysteryBoxScreen";
import ChatScreen from "./components/ui/ChatScreen";
import CharacterPreview from "./components/ui/CharacterPreview";

// Import stores
import { useGameState } from "./lib/stores/useGameState";
import { useAudio } from "./lib/stores/useAudio";
// Removed useAuth - using only Thirdweb wallet connection

// Import screens
import LeaderboardScreen from "./components/ui/LeaderboardScreen";
import WalletConnectScreen from "./components/ui/WalletConnectScreen";


// Thirdweb v5 config is handled in thirdweb.ts

// Define control keys for the game
enum Controls {
  left = 'left',
  right = 'right',
  jump = 'jump',
  start = 'start',
  restart = 'restart'
}

const controls = [
  { name: Controls.left, keys: ["KeyA", "ArrowLeft"] },
  { name: Controls.right, keys: ["KeyD", "ArrowRight"] },
  { name: Controls.jump, keys: ["Space"] },
  { name: Controls.start, keys: ["Enter"] },
  { name: Controls.restart, keys: ["KeyR"] },
];

// Inner App component that uses Thirdweb hooks
function AppContent() {
  const { gamePhase } = useGameState();
  const account = useActiveAccount();
  const [showCanvas, setShowCanvas] = useState(false);

  // Show the canvas once everything is loaded
  useEffect(() => {
    setShowCanvas(true);
  }, []);

  // Show wallet connection screen if no wallet connected
  if (!account) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-4xl font-bold text-white mb-4">Temple Runner</h1>
          <p className="text-xl text-purple-200 mb-8">NFT-Powered Infinite Runner on Base Camp</p>
          <WalletConnectScreen />
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
        {showCanvas && (
          <KeyboardControls map={controls}>
            {gamePhase === 'start' && <StartScreen />}
            
            {gamePhase === 'mint' && <MintScreen />}
            
            {gamePhase === 'characterPreview' && <CharacterPreview />}
            
            {gamePhase === 'mysteryBox' && <MysteryBoxScreen />}
            
            {gamePhase === 'leaderboard' && <LeaderboardScreen />}
            
            {gamePhase === 'chat' && <ChatScreen />}
            
            {gamePhase === 'gameOver' && <GameOverScreen />}

            {gamePhase === 'playing' && (
              <>
                <Canvas
                  camera={{
                    position: [0, 4, 8],
                    fov: 60,
                    near: 0.1,
                    far: 1000
                  }}
                  gl={{
                    antialias: true,
                    powerPreference: "high-performance",
                    precision: "mediump",
                    alpha: false,
                    stencil: false,
                    depth: true
                  }}
                  shadows
                  dpr={Math.min(window.devicePixelRatio, 2)}
                  performance={{ min: 0.5 }}
                  style={{ 
                    background: 'linear-gradient(to bottom, #87CEEB 0%, #98D8E8 30%, #F0E68C 70%, #90EE90 100%)'
                  }}
                  frameloop="demand"
                >
                  <color attach="background" args={["#87CEEB"]} />
                  
                  <Suspense fallback={null}>
                    <GameScene />
                  </Suspense>
                </Canvas>
                
                <GameUI />
              </>
            )}
          </KeyboardControls>
        )}
      </div>
  );
}

// Main App component wrapped in ThirdwebProvider
function App() {
  return (
    <ThirdwebProvider client={client}>
      <AppContent />
    </ThirdwebProvider>
  );
}

export default App;
