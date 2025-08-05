import { useGameState } from "../../lib/stores/useGameState";
import { usePlayer } from "../../lib/stores/usePlayer";
import { useRewards } from "../../lib/stores/useRewards";
import { useAudio } from "../../lib/stores/useAudio";
import { useIsMobile } from "../../hooks/use-is-mobile";
import TouchControls from "./TouchControls";

export default function GameUI() {
  const { score, distance } = useGameState();
  const { position, moveLeft, moveRight, jump } = usePlayer();
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

      {/* Touch Controls for Mobile */}
      <TouchControls 
        onLeft={moveLeft}
        onRight={moveRight}
        onJump={jump}
        onLeftEnd={() => {}}
        onRightEnd={() => {}}
      />
    </div>
  );
}
