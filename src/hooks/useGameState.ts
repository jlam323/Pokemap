import { useState, useRef, useEffect, MutableRefObject } from 'react';
import { GameState, Entity, Item, Position } from '../types';
import { TILE_SIZE } from '../constants';
import { INITIAL_NPCS } from '../data/npcs';
import { INITIAL_PLAYER } from '../data/player';
import { INITIAL_ITEMS } from '../data/items';
import { ALL_MAPS } from '../data/maps';
import { spawnDynamicPokemon } from '../lib/gameLogic';

import { prepareMapData } from '../lib/mapLogic';

/**
 * Generates the initial game state for the starting map.
 * Prepares map data including NPCs, items, and player position.
 * 
 * @returns {GameState} The fully initialized starting game state.
 */
export function getInitialGameState(): GameState {
  const initialMap = ALL_MAPS[0];
  const { npcs, items, playerPos } = prepareMapData(initialMap.id, [], INITIAL_PLAYER);

  return {
    player: { ...INITIAL_PLAYER, pos: playerPos },
    npcs,
    items,
    isTalking: false,
    talkingNPCId: null,
    talkingItemId: null,
    activeDialogue: null,
    dialogueIndex: 0,
    currentMapId: initialMap.id,
    previousMapId: null,
    mapReturnPositions: {},
    collectedItemIds: [],
    isTransitioning: false,
    hasInteractedWithNPC: false,
    hasInteractedWithItem: false
  };
}

/**
 * Hook for managing the core game state and providing mutable refs for high-frequency updates.
 * 
 * This hook bridges the gap between React's declarative state (for UI/Rendering) 
 * and mutable refs (for the physics/logic loop) to ensure smooth performance.
 * 
 * @returns {Object} State, state setter, and various entity/position refs.
 */
export function useGameState() {
  const [gameState, setGameState] = useState<GameState>(getInitialGameState);

  const playerRef = useRef<Entity>(gameState.player);
  const npcsRef = useRef<Entity[]>(gameState.npcs);
  const itemsRef = useRef<Item[]>(gameState.items);
  const stateRef = useRef<GameState>(gameState);
  const startPosRef = useRef<Position>(gameState.player.pos);
  const targetPosRef = useRef<Position>(gameState.player.pos);

  useEffect(() => {
    stateRef.current = gameState;
  }, [gameState]);

  return {
    gameState,
    setGameState,
    playerRef,
    npcsRef,
    itemsRef,
    stateRef,
    startPosRef,
    targetPosRef
  };
}
