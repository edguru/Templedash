import { useTouchControls } from "../../hooks/use-touch-controls";
import { useIsMobile } from "../../hooks/use-is-mobile";

interface TouchControlsProps {
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onJump: () => void;
}

export default function TouchControls({ onMoveLeft, onMoveRight, onJump }: TouchControlsProps) {
  const isMobile = useIsMobile();
  const { isMovingLeft, isMovingRight, isJumping, onTouchStart, onTouchEnd } = useTouchControls();

  // Don't show touch controls on desktop
  if (!isMobile) return null;

  // Call game functions when touch states change
  if (isMovingLeft) onMoveLeft();
  if (isMovingRight) onMoveRight();
  if (isJumping) onJump();

  return (
    <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none z-50">
      {/* Left Movement Area */}
      <div 
        className="absolute bottom-4 left-4 w-16 h-16 sm:w-20 sm:h-20 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm border-2 border-white/40 pointer-events-auto select-none touch-button"
        onTouchStart={(e) => {
          e.preventDefault();
          onTouchStart('left');
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          onTouchEnd('left');
        }}
        style={{ 
          backgroundColor: isMovingLeft ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255, 255, 255, 0.2)',
          transform: isMovingLeft ? 'scale(0.95)' : 'scale(1)',
          transition: 'all 0.1s ease'
        }}
      >
        <div className="text-white text-xl font-bold">←</div>
      </div>

      {/* Right Movement Area */}
      <div 
        className="absolute bottom-4 left-24 sm:left-28 w-16 h-16 sm:w-20 sm:h-20 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm border-2 border-white/40 pointer-events-auto select-none touch-button"
        onTouchStart={(e) => {
          e.preventDefault();
          onTouchStart('right');
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          onTouchEnd('right');
        }}
        style={{ 
          backgroundColor: isMovingRight ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255, 255, 255, 0.2)',
          transform: isMovingRight ? 'scale(0.95)' : 'scale(1)',
          transition: 'all 0.1s ease'
        }}
      >
        <div className="text-white text-xl font-bold">→</div>
      </div>

      {/* Jump Button */}
      <div 
        className="absolute bottom-4 right-4 w-20 h-20 sm:w-24 sm:h-24 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm border-2 border-white/40 pointer-events-auto select-none touch-button"
        onTouchStart={(e) => {
          e.preventDefault();
          onTouchStart('jump');
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          onTouchEnd('jump');
        }}
        style={{ 
          backgroundColor: isJumping ? 'rgba(34, 197, 94, 0.5)' : 'rgba(255, 255, 255, 0.2)',
          transform: isJumping ? 'scale(0.95)' : 'scale(1)',
          transition: 'all 0.1s ease'
        }}
      >
        <div className="text-white text-xl font-bold">↑</div>
      </div>

      {/* Touch Instructions */}
      <div className="absolute bottom-28 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-lg text-xs text-center">
        Touch controls: Move ← → | Jump ↑
      </div>
    </div>
  );
}