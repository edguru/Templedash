import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useState } from "react";
import { KeyboardControls } from "@react-three/drei";
import { PrivyProvider } from '@privy-io/react-auth';
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
import { useAuth } from "./lib/stores/useAuth";

// Import screens
import LeaderboardScreen from "./components/ui/LeaderboardScreen";
import WalletConnectScreen from "./components/ui/WalletConnectScreen";

// Privy config - you'll need to replace with your actual app ID
const PRIVY_APP_ID = 'clpispdty00ycl80fpueukbhl'; // Replace with your Privy app ID

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

// Main App component
function App() {
  const { gamePhase } = useGameState();
  const { isAuthenticated } = useAuth();
  const [showCanvas, setShowCanvas] = useState(false);

  // Show the canvas once everything is loaded
  useEffect(() => {
    setShowCanvas(true);
  }, []);

  // Show wallet connection screen if not authenticated
  if (!isAuthenticated) {
    return (
      <PrivyProvider
        appId={PRIVY_APP_ID}
        config={{
          loginMethods: ['wallet'],
          appearance: {
            theme: 'light',
            accentColor: '#9333EA',
          },
          embeddedWallets: {
            createOnLogin: 'users-without-wallets',
          },
        }}
      >
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
          <div className="text-center p-8">
            <h1 className="text-4xl font-bold text-white mb-4">Temple Runner</h1>
            <p className="text-xl text-purple-200 mb-8">NFT-Powered Infinite Runner</p>
            <button 
              onClick={() => {
                // Bypass wallet connection for demo
                window.localStorage.setItem('demo-auth', 'true');
                window.location.reload();
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
            >
              Demo Mode - View Game Scene
            </button>
            <div className="mt-4">
              <WalletConnectScreen />
            </div>
          </div>
        </div>
      </PrivyProvider>
    );
  }

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ['wallet'],
        appearance: {
          theme: 'light',
          accentColor: '#9333EA',
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
      }}
    >
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
    </PrivyProvider>
  );
}

export default App;
