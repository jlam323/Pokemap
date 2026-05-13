import { useEffect, useCallback } from 'react';
import { ALL_MAPS } from '../data/maps';
import { useGameState } from '../hooks/useGameState';
import { useCollisionSystem } from '../hooks/useCollisionSystem';
import { useMapSystem } from '../hooks/useMapSystem';
import { useEntityUpdates } from '../hooks/useEntityUpdates';
import { useInteractions } from '../hooks/useInteractions';
import { usePokeballs } from '../hooks/usePokeballs';
import { useInputSystem } from '../hooks/useInputSystem';

export function GameEngine() {
  const {
    gameState,
    setGameState,
    playerRef,
    npcsRef,
    itemsRef,
    stateRef,
    startPosRef,
    targetPosRef
  } = useGameState();

  const {
    collisionMapRef,
    initCollisionMap
  } = useCollisionSystem();

  useEffect(() => {
    initCollisionMap(gameState.player, gameState.npcs, gameState.items);
  }, []);

  const currentMap = ALL_MAPS.find(m => m.id === gameState.currentMapId) || ALL_MAPS[0];

  const {
    handleInteraction
  } = useInteractions({
    setGameState,
    stateRef,
    playerRef,
    npcsRef,
    itemsRef,
    initCollisionMap
  });

  const { spawnPokeball, updatePokeballs, pokeballsRef } = usePokeballs({
    setGameState,
    stateRef,
    playerRef,
    npcsRef,
    itemsRef,
    initCollisionMap
  });

  const toggleMenu = useCallback(() => {
    setGameState(prev => {
      // Don't open menu if talking or transitioning
      if (prev.isTalking || prev.isTransitioning) return prev;
      
      return {
        ...prev,
        menuState: prev.menuState === 'CLOSED' ? 'MAIN' : 'CLOSED'
      };
    });
  }, [setGameState]);

  const {
    keysPressed,
    handleArrowDown,
    handleArrowUp
  } = useInputSystem({
    handleInteraction,
    handleThrow: spawnPokeball,
    handleToggleMenu: toggleMenu
  });

  const {
    changeMap,
    teleportPlayer,
    isAutoSteppingRef,
    autoStepDirRef
  } = useMapSystem({
    setGameState,
    stateRef,
    playerRef,
    npcsRef,
    itemsRef,
    initCollisionMap,
    startPosRef,
    targetPosRef
  });

  const {
    updateNPCs,
    updatePlayer
  } = useEntityUpdates({
    stateRef,
    playerRef,
    npcsRef,
    collisionMapRef,
    changeMap,
    isAutoSteppingRef,
    autoStepDirRef,
    keysPressed,
    startPosRef,
    targetPosRef,
    teleportPlayer
  });

  const update = useCallback((dt: number) => {
    const currentState = stateRef.current;
    const isPaused = currentState.isTalking || currentState.isTransitioning || currentState.menuState !== 'CLOSED';
    
    updateNPCs(dt, isPaused, currentState.isTransitioning);
    updatePlayer(dt, isPaused, currentState);
    updatePokeballs(dt);

    if (currentState.floatingMessages.length > 0) {
      const now = Date.now();
      const activeMessages = currentState.floatingMessages.filter(
        msg => now - msg.startTime < msg.duration
      );
      if (activeMessages.length !== currentState.floatingMessages.length) {
        setGameState(prev => ({
          ...prev,
          floatingMessages: activeMessages
        }));
      }
    }

    if (currentState.vfx.length > 0) {
      const now = Date.now();
      const activeVfx = currentState.vfx.filter(
        effect => now - effect.startTime < effect.duration
      );
      if (activeVfx.length !== currentState.vfx.length) {
        setGameState(prev => ({
          ...prev,
          vfx: activeVfx
        }));
      }
    }
  }, [updateNPCs, updatePlayer, updatePokeballs, stateRef, setGameState]);

  return {
    gameState,
    setGameState,
    playerRef,
    npcsRef,
    itemsRef,
    stateRef,
    pokeballsRef,
    keysPressed,
    update,
    handleArrowDown,
    handleArrowUp,
    changeMap,
    teleportPlayer,
    currentMap
  };
}
