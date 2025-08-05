import { useState, useRef, useEffect } from 'react';
import { useGameState } from '../../lib/stores/useGameState';

interface TouchControlsProps {
  onLeft: () => void;
  onRight: () => void;
  onJump: () => void;
  onLeftEnd: () => void;
  onRightEnd: () => void;
}

export default function TouchControls({ onLeft, onRight, onJump, onLeftEnd, onRightEnd }: TouchControlsProps) {
  const [leftPressed, setLeftPressed] = useState(false);
  const [rightPressed, setRightPressed] = useState(false);
  const [jumpPressed, setJumpPressed] = useState(false);
  const { gamePhase } = useGameState();

  // Only show controls during gameplay
  if (gamePhase !== 'playing') return null;

  const handleTouchStart = (action: string) => (e: React.TouchEvent) => {
    e.preventDefault();
    
    if (action === 'left') {
      setLeftPressed(true);
      onLeft();
    } else if (action === 'right') {
      setRightPressed(true);
      onRight();
    } else if (action === 'jump') {
      setJumpPressed(true);
      onJump();
    }
  };

  const handleTouchEnd = (action: string) => (e: React.TouchEvent) => {
    e.preventDefault();
    
    if (action === 'left') {
      setLeftPressed(false);
      onLeftEnd();
    } else if (action === 'right') {
      setRightPressed(false);
      onRightEnd();
    } else if (action === 'jump') {
      setJumpPressed(false);
    }
  };

  return (
    <>
      {/* Mobile Touch Controls */}
      <div className="fixed bottom-4 left-4 right-4 flex justify-between items-end z-50 md:hidden">
        {/* Left/Right Movement */}
        <div className="flex space-x-3">
          <button
            onTouchStart={handleTouchStart('left')}
            onTouchEnd={handleTouchEnd('left')}
            className={`w-16 h-16 rounded-full shadow-lg transition-all ${
              leftPressed 
                ? 'bg-blue-600 scale-110' 
                : 'bg-blue-500 hover:bg-blue-600'
            } text-white text-2xl font-bold flex items-center justify-center border-2 border-white/20`}
            style={{ touchAction: 'manipulation' }}
          >
            ←
          </button>
          
          <button
            onTouchStart={handleTouchStart('right')}
            onTouchEnd={handleTouchEnd('right')}
            className={`w-16 h-16 rounded-full shadow-lg transition-all ${
              rightPressed 
                ? 'bg-blue-600 scale-110' 
                : 'bg-blue-500 hover:bg-blue-600'
            } text-white text-2xl font-bold flex items-center justify-center border-2 border-white/20`}
            style={{ touchAction: 'manipulation' }}
          >
            →
          </button>
        </div>

        {/* Jump Button */}
        <button
          onTouchStart={handleTouchStart('jump')}
          onTouchEnd={handleTouchEnd('jump')}
          className={`w-20 h-20 rounded-full shadow-lg transition-all ${
            jumpPressed 
              ? 'bg-green-600 scale-110' 
              : 'bg-green-500 hover:bg-green-600'
          } text-white text-2xl font-bold flex items-center justify-center border-2 border-white/20`}
          style={{ touchAction: 'manipulation' }}
        >
          ↑
        </button>
      </div>
      
      {/* Desktop Button Controls */}
      <div className="fixed bottom-4 left-4 right-4 hidden md:flex justify-center items-center z-50">
        <div className="bg-black/20 backdrop-blur rounded-2xl p-4 flex items-center space-x-4">
          <div className="text-white text-sm font-medium mr-4">Controls:</div>
          
          <div className="flex items-center space-x-2">
            <kbd className="px-3 py-2 bg-white/20 text-white rounded-lg text-sm font-mono">A</kbd>
            <span className="text-white/70 text-sm">Left</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <kbd className="px-3 py-2 bg-white/20 text-white rounded-lg text-sm font-mono">D</kbd>
            <span className="text-white/70 text-sm">Right</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <kbd className="px-3 py-2 bg-white/20 text-white rounded-lg text-sm font-mono">Space</kbd>
            <span className="text-white/70 text-sm">Jump</span>
          </div>
        </div>
      </div>
    </>
  );
}