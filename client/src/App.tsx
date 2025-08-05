import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useState } from "react";
import { KeyboardControls } from "@react-three/drei";
// import { ThirdwebProvider, ConnectWallet } from "@thirdweb-dev/react";
import "@fontsource/inter";

// Import game components
import GameScene from "./components/game/GameScene";
import GameUI from "./components/ui/GameUI";
import StartScreen from "./components/ui/StartScreen";
import GameOverScreen from "./components/ui/GameOverScreen";
import MintScreen from "./components/ui/MintScreen";
import MysteryBoxScreen from "./components/ui/MysteryBoxScreen";

// Import stores
import { useGameState } from "./lib/stores/useGameState";
import { useAudio } from "./lib/stores/useAudio";
import { useAuth } from "./lib/stores/useAuth";

// Import auth components
import LoginScreen from "./components/auth/LoginScreen";
import LeaderboardScreen from "./components/ui/LeaderboardScreen";

// Thirdweb config - temporarily disabled
// import { clientId, activeChain } from "./lib/thirdweb";

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

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
        {showCanvas && (
          <KeyboardControls map={controls}>
            {gamePhase === 'start' && <StartScreen />}
            
            {gamePhase === 'mint' && <MintScreen />}
            
            {gamePhase === 'mysteryBox' && <MysteryBoxScreen />}
            
            {gamePhase === 'leaderboard' && <LeaderboardScreen />}
            
            {gamePhase === 'gameOver' && <GameOverScreen />}

            {gamePhase === 'playing' && (
              <>
                <Canvas
                  camera={{
                    position: [0, 5, 10],
                    fov: 60,
                    near: 0.1,
                    far: 1000
                  }}
                  gl={{
                    antialias: false,
                    powerPreference: "high-performance",
                    precision: "lowp"
                  }}
                  dpr={Math.min(window.devicePixelRatio, 1.5)}
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

export default App;
