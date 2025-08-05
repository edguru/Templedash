import { useGameState } from "../../lib/stores/useGameState";
import { usePlayer } from "../../lib/stores/usePlayer";

export default function SimpleTouchControls() {
  const { gamePhase } = useGameState();
  const { moveLeft, moveRight, jump, isJumping } = usePlayer();

  if (gamePhase !== 'playing') return null;

  const handleLeftStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    moveLeft();
  };

  const handleRightStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    moveRight();
  };

  const handleJumpStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!isJumping) {
      jump();
    }
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 flex justify-between items-end pointer-events-none z-10">
      {/* Left side controls */}
      <div className="flex space-x-4 pointer-events-auto">
        <button
          className="w-16 h-16 bg-blue-500/70 rounded-full flex items-center justify-center text-white text-2xl font-bold border-2 border-blue-300 shadow-lg active:bg-blue-600/70 transition-colors touch-manipulation"
          onTouchStart={handleLeftStart}
          onMouseDown={handleLeftStart}
          style={{ userSelect: 'none' }}
        >
          ←
        </button>
        
        <button
          className="w-16 h-16 bg-blue-500/70 rounded-full flex items-center justify-center text-white text-2xl font-bold border-2 border-blue-300 shadow-lg active:bg-blue-600/70 transition-colors touch-manipulation"
          onTouchStart={handleRightStart}
          onMouseDown={handleRightStart}
          style={{ userSelect: 'none' }}
        >
          →
        </button>
      </div>

      {/* Right side jump button */}
      <div className="pointer-events-auto">
        <button
          className="w-20 h-20 bg-green-500/70 rounded-full flex items-center justify-center text-white text-xl font-bold border-2 border-green-300 shadow-lg active:bg-green-600/70 transition-colors touch-manipulation"
          onTouchStart={handleJumpStart}
          onMouseDown={handleJumpStart}
          style={{ userSelect: 'none' }}
        >
          ↑
        </button>
      </div>
    </div>
  );
}