import { useEffect, useRef, useCallback } from 'react';
import { Direction } from '../types';

interface InputSystemProps {
  handleInteraction: () => void;
}

/**
 * Hook to manage player input via keyboard and virtual directional pad.
 * 
 * It tracks physical key states ('keydown'/'keyup') and provides handlers 
 * for UI-based arrow controls. It also manages the interaction trigger (Enter/Space).
 * 
 * @param props - Interaction handler to trigger when action keys are pressed.
 * @returns {Object} keysPressed ref and directional arrow handlers.
 */
export function useInputSystem({ handleInteraction }: InputSystemProps) {
  const keysPressed = useRef<Set<string>>(new Set());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key.toLowerCase());
      if (e.key === ' ' || e.key === 'Enter') {
        handleInteraction();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase());
    };
    const handleBlur = () => {
      keysPressed.current.clear();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [handleInteraction]);

  const handleArrowDown = useCallback((dir: Direction) => {
    const keyMap: Record<Direction, string> = {
      up: 'arrowup',
      down: 'arrowdown',
      left: 'arrowleft',
      right: 'arrowright'
    };
    keysPressed.current.add(keyMap[dir]);
  }, []);

  const handleArrowUp = useCallback((dir: Direction) => {
    const keyMap: Record<Direction, string> = {
      up: 'arrowup',
      down: 'arrowdown',
      left: 'arrowleft',
      right: 'arrowright'
    };
    keysPressed.current.delete(keyMap[dir]);
  }, []);

  return {
    keysPressed,
    handleArrowDown,
    handleArrowUp
  };
}
