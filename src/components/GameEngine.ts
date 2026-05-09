import { useEffect, useCallback } from 'react';
import { ALL_MAPS } from '../data/maps';
import { useGameState } from '../hooks/useGameState';
import { useCollisionSystem } from '../hooks/useCollisionSystem';
import { useMapSystem } from '../hooks/useMapSystem';
import { useEntityUpdates } from '../hooks/useEntityUpdates';
import { useInteractions } from '../hooks/useInteractions';
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

  const {
    keysPressed,
    handleArrowDown,
    handleArrowUp
  } = useInputSystem({
    handleInteraction
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
    updateNPCs(dt, currentState.isTalking, currentState.isTransitioning);
    updatePlayer(dt, currentState.isTalking, currentState);
  }, [updateNPCs, updatePlayer, stateRef]);

  return {
    gameState,
    setGameState,
    playerRef,
    npcsRef,
    itemsRef,
    stateRef,
    keysPressed,
    update,
    handleInteraction,
    handleArrowDown,
    handleArrowUp,
    changeMap,
    teleportPlayer,
    currentMap
  };
}
