import { Canvas } from "@react-three/fiber";
import { KeyboardControls } from "@react-three/drei";
import { Suspense, useEffect, useState } from "react";
// Removed KeyboardControls - using direct event handlers
import { ThirdwebProvider } from 'thirdweb/react';
import { useActiveAccount } from 'thirdweb/react';
import { client, baseCampTestnet } from './lib/thirdweb';
import "@fontsource/inter";

// Import game components
import GameScene from "./components/game/GameScene";
import GameUI from "./components/ui/GameUI";
import MainApp from "./components/ui/MainApp";
import StartScreen from "./components/ui/StartScreen";
import GameOverScreen from "./components/ui/GameOverScreen";
import MintScreen from "./components/ui/MintScreen";
import MysteryBoxScreen from "./components/ui/MysteryBoxScreen";
import ChatScreen from "./components/ui/ChatScreen";
import CharacterPreview from "./components/ui/CharacterPreview";
import UserProfileScreen from "./components/ui/UserProfileScreen";
import CharacterSelector from "./components/ui/CharacterSelector";
import OnboardingScreen from "./components/ui/OnboardingScreen";
import TutorialScreen from "./components/ui/TutorialScreen";
import MintMoreScreen from "./components/ui/MintMoreScreen";
import CharacterSelectPopup from "./components/ui/CharacterSelectPopup";
import CompanionCreationScreen from "./components/ui/CompanionCreationScreen";
import CompanionManagementScreen from "./components/ui/CompanionManagementScreen";
import CompanionPromptScreen from "./components/ui/CompanionPromptScreen";

// Import stores
import { useGameState } from "./lib/stores/useGameState";
import { useAudio } from "./lib/stores/useAudio";
import { useCompanion } from "./lib/stores/useCompanion";
// Removed useAuth - using only Thirdweb wallet connection

// Import screens
import LeaderboardScreen from "./components/ui/LeaderboardScreen";
import AuthScreen from "./components/ui/AuthScreen";


// Thirdweb v5 config is handled in thirdweb.ts

// Define keyboard controls for game
enum Controls {
  left = 'left',
  right = 'right',
  jump = 'jump',
  start = 'start',
  restart = 'restart'
}

// Inner App component that uses Thirdweb hooks
function AppContent() {
  const { gamePhase, setGamePhase } = useGameState();
  const { companion, setCompanion, hasCompanionNFT } = useCompanion();
  const account = useActiveAccount();
  const [showCanvas, setShowCanvas] = useState(false);

  // Show the canvas once everything is loaded
  useEffect(() => {
    setShowCanvas(true);
  }, []);

  // Global keyboard debugging - this should always work
  useEffect(() => {

    
    const globalKeyHandler = (e: KeyboardEvent) => {
      console.log('🌍 GLOBAL keyboard event detected:', e.code, e.key, 'Game phase:', gamePhase);
      
      if (['KeyA', 'KeyD', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        console.log('🎯 GLOBAL game key detected:', e.code, 'in phase:', gamePhase);
      }
    };
    
    window.addEventListener('keydown', globalKeyHandler, true);
    document.addEventListener('keydown', globalKeyHandler, true);
    
    return () => {
      window.removeEventListener('keydown', globalKeyHandler, true);
      document.removeEventListener('keydown', globalKeyHandler, true);
    };
  }, [gamePhase]);

  // Authentication state
  const [authComplete, setAuthComplete] = useState(false);
  const [companionChecked, setCompanionChecked] = useState(false);

  // Manage body class for game mode to control overflow
  useEffect(() => {
    const body = document.body;
    if (gamePhase === 'playing') {
      body.classList.add('game-mode');
    } else {
      body.classList.remove('game-mode');
    }
    
    // Cleanup on unmount
    return () => {
      body.classList.remove('game-mode');
    };
  }, [gamePhase]);

  // Check authentication and force companion creation
  useEffect(() => {
    if (account?.address) {
      setAuthComplete(true);
    } else {
      setAuthComplete(false);
      setCompanionChecked(false);
    }
  }, [account?.address]);

  // MANDATORY companion check for ALL users after authentication
  useEffect(() => {
    const checkCompanion = async () => {
      if (account?.address && authComplete && !companionChecked) {
        try {
          const { companionService } = await import('./lib/companionService');
          const hasCompanion = await companionService.hasCompanion(account.address);
          
          if (hasCompanion) {
            const companionData = await companionService.getCompanionByOwner(account.address);
            if (companionData) {
              setCompanion(companionData.traits);
              // Only proceed to main app if companion exists and is loaded
              if (gamePhase !== 'main' && gamePhase !== 'playing') {
                setGamePhase('main');
              }
            } else {
              // Even if hasCompanion=true but no data, force creation
              setGamePhase('companionPrompt');
            }
          } else {
            // No companion found - FORCE creation for ALL users (new and existing)
            setGamePhase('companionPrompt');
          }
        } catch (error) {
          console.error('Error checking companion:', error);
          // On any error, force companion creation to be safe
          setGamePhase('companionPrompt');
        } finally {
          setCompanionChecked(true);
        }
      }
    };

    checkCompanion();
  }, [account?.address, authComplete, companionChecked, setGamePhase, setCompanion]);

  // Show auth screen if no wallet connected
  if (!account) {
    return (
      <div className="w-full h-screen">
        <AuthScreen onAuthComplete={() => setAuthComplete(true)} />
      </div>
    );
  }

  // If authenticated but companion not checked yet, show loading or wait
  if (authComplete && !companionChecked) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking companion status...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
        {showCanvas && (
          <>
            {gamePhase === 'main' && <MainApp />}
            
            {gamePhase === 'onboarding' && <OnboardingScreen />}
            
            {gamePhase === 'tutorial' && <TutorialScreen />}
            
            {gamePhase === 'start' && <StartScreen />}
            
            {gamePhase === 'mint' && <MintScreen />}
            
            {gamePhase === 'characterPreview' && <CharacterPreview />}
            
            {gamePhase === 'characterSelect' && <CharacterSelector />}
            
            {gamePhase === 'mysteryBox' && <MysteryBoxScreen />}
            
            {gamePhase === 'leaderboard' && <LeaderboardScreen />}
            
            {gamePhase === 'chat' && <ChatScreen />}
            
            {gamePhase === 'profile' && <UserProfileScreen />}
            
            {gamePhase === 'mintMore' && <MintMoreScreen />}
            
            {gamePhase === 'characterSelectPopup' && <CharacterSelectPopup />}
            
            {gamePhase === 'companionCreation' && (
              <CompanionCreationScreen
                onCompanionCreated={async (traits) => {
                  try {
                    const { companionService } = await import('./lib/companionService');
                    if (account) {
                      await companionService.mintCompanion(account, traits);
                      setCompanion(traits);
                      setGamePhase('main');
                    }
                  } catch (error) {
                    console.error('Error creating companion:', error);
                    alert('Failed to create companion. Please try again.');
                  }
                }}
                onBack={() => setGamePhase('main')}
              />
            )}
            
            {gamePhase === 'companionManagement' && companion && (
              <CompanionManagementScreen
                companion={companion}
                onCompanionUpdated={async (traits) => {
                  try {
                    const { companionService } = await import('./lib/companionService');
                    if (account && companion?.tokenId) {
                      await companionService.updateCompanion(account, companion.tokenId, traits);
                      setCompanion(traits);
                    }
                  } catch (error) {
                    console.error('Error updating companion:', error);
                    throw error;
                  }
                }}
                onBack={() => setGamePhase('main')}
              />
            )}
            
            {gamePhase === 'companionPrompt' && (
              <CompanionPromptScreen
                onCreateCompanion={() => setGamePhase('companionCreation')}
                onSkip={() => setGamePhase('main')}
              />
            )}
            
            {gamePhase === 'gameOver' && <GameOverScreen />}

            {gamePhase === 'playing' && (
              <>
                <KeyboardControls
                  map={[
                    { name: Controls.left, keys: ['ArrowLeft', 'KeyA'] },
                    { name: Controls.right, keys: ['ArrowRight', 'KeyD'] },
                    { name: Controls.jump, keys: ['Space', 'ArrowUp', 'KeyW'] },
                    { name: Controls.start, keys: ['Enter'] },
                    { name: Controls.restart, keys: ['KeyR'] },
                  ]}
                >
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
                      precision: "highp", // Upgraded from mediump for better quality
                      alpha: false,
                      stencil: false,
                      depth: true,
                      logarithmicDepthBuffer: true, // Better depth precision
                      preserveDrawingBuffer: false
                    }}
                    shadows
                    dpr={[1, Math.min(window.devicePixelRatio, 2)]} // Range for adaptive quality
                    performance={{ 
                      min: 0.5,
                      max: 1,
                      debounce: 200
                    }}
                    style={{ 
                      background: 'linear-gradient(to bottom, #87CEEB 0%, #98D8E8 30%, #F0E68C 70%, #90EE90 100%)'
                    }}
                    frameloop="always" // Changed from demand for smoother animations
                  >
                    <color attach="background" args={["#87CEEB"]} />
                    
                    <Suspense fallback={null}>
                      <GameScene />
                    </Suspense>
                  </Canvas>
                </KeyboardControls>
                
                <GameUI />
              </>
            )}
          </>
        )}
      </div>
  );
}

// Main App component wrapped in ThirdwebProvider
function App() {
  return (
    <ThirdwebProvider>
      <AppContent />
    </ThirdwebProvider>
  );
}

export default App;
