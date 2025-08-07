import { useGameState } from "../../lib/stores/useGameState";
import { usePlayer } from "../../lib/stores/usePlayer";
import { useRewards } from "../../lib/stores/useRewards";
import { useAudio } from "../../lib/stores/useAudio";
import { useIsMobile } from "../../hooks/use-is-mobile";

export default function GameUI() {
  const { score, distance } = useGameState();
  const { position, moveLeft, moveRight, jump, isJumping } = usePlayer();
  const { totalCoins, completedRuns } = useRewards();
  const { isMuted, toggleMute } = useAudio();
  const isMobile = useIsMobile();

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Top HUD */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-auto">
        <div className="bg-black/70 text-white p-3 rounded-lg">
          <div className="text-lg font-bold">Score: {score}</div>
          <div className="text-sm">Distance: {Math.floor(distance)}m</div>
        </div>
        
        <div className="bg-black/70 text-white p-3 rounded-lg">
          <div className="text-sm">Coins: {totalCoins}</div>
          <div className="text-sm">Runs: {completedRuns}</div>
        </div>
      </div>

      {/* Bottom controls - adjust for mobile */}
      <div className={`absolute left-4 right-4 flex justify-between items-end pointer-events-auto ${isMobile ? 'bottom-36' : 'bottom-4'}`}>
        {!isMobile && (
          <div className="bg-black/70 text-white p-2 rounded-lg text-xs">
            <div>A/← : Move Left</div>
            <div>D/→ : Move Right</div>
            <div>Space: Jump</div>
          </div>
        )}
        
        <button
          onClick={toggleMute}
          className={`bg-black/70 text-white p-3 rounded-lg hover:bg-black/90 transition-colors ${isMobile ? 'ml-auto' : ''}`}
        >
          {isMuted ? "🔇" : "🔊"}
        </button>
      </div>

      {/* Mobile Touch Controls */}
      {isMobile && (
        <div className="fixed bottom-4 left-4 right-4 flex justify-between items-end pointer-events-none z-50">
          {/* Left/Right Movement */}
          <div className="flex space-x-3 pointer-events-auto">
            <button
              onPointerDown={(e) => { e.preventDefault(); moveLeft(); }}
              className="w-16 h-16 rounded-full shadow-lg bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white text-2xl font-bold flex items-center justify-center border-2 border-white/20 select-none"
              style={{ touchAction: 'none', userSelect: 'none' }}
            >
              ←
            </button>
            
            <button
              onPointerDown={(e) => { e.preventDefault(); moveRight(); }}
              className="w-16 h-16 rounded-full shadow-lg bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white text-2xl font-bold flex items-center justify-center border-2 border-white/20 select-none"
              style={{ touchAction: 'none', userSelect: 'none' }}
            >
              →
            </button>
          </div>

          {/* Jump Button */}
          <button
            onPointerDown={(e) => { e.preventDefault(); if (!isJumping) jump(); }}
            className="w-20 h-20 rounded-full shadow-lg bg-green-500 hover:bg-green-600 active:bg-green-700 text-white text-xl font-bold flex items-center justify-center border-2 border-white/20 select-none pointer-events-auto"
            style={{ touchAction: 'none', userSelect: 'none' }}
          >
            ↑
          </button>
        </div>
      )}
    </div>
  );
}
