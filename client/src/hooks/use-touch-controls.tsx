import { useEffect, useRef, useState } from 'react';

interface TouchControls {
  isMovingLeft: boolean;
  isMovingRight: boolean;
  isJumping: boolean;
  onTouchStart: (direction: 'left' | 'right' | 'jump') => void;
  onTouchEnd: (direction: 'left' | 'right' | 'jump') => void;
}

export function useTouchControls(): TouchControls {
  const [isMovingLeft, setIsMovingLeft] = useState(false);
  const [isMovingRight, setIsMovingRight] = useState(false);
  const [isJumping, setIsJumping] = useState(false);
  
  const leftTouchRef = useRef<boolean>(false);
  const rightTouchRef = useRef<boolean>(false);
  const jumpTouchRef = useRef<boolean>(false);

  const onTouchStart = (direction: 'left' | 'right' | 'jump') => {
    switch (direction) {
      case 'left':
        leftTouchRef.current = true;
        setIsMovingLeft(true);
        break;
      case 'right':
        rightTouchRef.current = true;
        setIsMovingRight(true);
        break;
      case 'jump':
        jumpTouchRef.current = true;
        setIsJumping(true);
        // Auto-release jump after short duration
        setTimeout(() => {
          jumpTouchRef.current = false;
          setIsJumping(false);
        }, 200);
        break;
    }
  };

  const onTouchEnd = (direction: 'left' | 'right' | 'jump') => {
    switch (direction) {
      case 'left':
        leftTouchRef.current = false;
        setIsMovingLeft(false);
        break;
      case 'right':
        rightTouchRef.current = false;
        setIsMovingRight(false);
        break;
      case 'jump':
        jumpTouchRef.current = false;
        setIsJumping(false);
        break;
    }
  };

  // Prevent scrolling when touching control areas
  useEffect(() => {
    const preventDefault = (e: TouchEvent) => {
      if (leftTouchRef.current || rightTouchRef.current || jumpTouchRef.current) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchmove', preventDefault, { passive: false });
    return () => document.removeEventListener('touchmove', preventDefault);
  }, []);

  return {
    isMovingLeft,
    isMovingRight,
    isJumping,
    onTouchStart,
    onTouchEnd,
  };
}