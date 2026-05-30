import { useCallback, useRef, MutableRefObject } from 'react';
import { Position, Entity, Item, Direction, TileType } from '../types';
import { TILE_SIZE, MOVE_DURATION } from '../constants';
import { ALL_MAPS } from '../data/maps';
import { TILE_GRIDS } from '../lib/gameLogic';
import { prepareMapData } from '../lib/mapLogic';
import { gameStore } from '../stores/GameStore';

interface MapSystemProps {
  playerRef: MutableRefObject<Entity>;
  npcsRef: MutableRefObject<Entity[]>;
  itemsRef: MutableRefObject<Item[]>;
  initCollisionMap: (player: Entity, npcs: Entity[], items: Item[]) => void;
  startPosRef: MutableRefObject<Position>;
  targetPosRef: MutableRefObject<Position>;
}

/**
 * Hook for managing map transitions, player spawning, and entry animations.
 * 
 * It coordinates:
 * - Fading the screen out/in during map changes
 * - Preparing new map data (entities/collision)
 * - Automated "entry steps" where the player walks one step into a room
 * - Tracking "return positions" for multi-level buildings
 * 
 * @param props - Refs and state setters for managing game world data.
 * @returns {Object} changeMap function and auto-stepping control refs.
 */
export function useMapSystem({
  playerRef,
  npcsRef,
  itemsRef,
  initCollisionMap,
  startPosRef,
  targetPosRef
}: MapSystemProps) {
  const isAutoSteppingRef = useRef(false);
  const autoStepDirRef = useRef<Direction | null>(null);

  /**
   * Logic to force the player to take one step into a room after entering.
   * This mimics the behavior of Game Boy Pokemon games when entering doors.
   * 
   * @param mapId - Current map ID
   * @param spawnPos - Where the player just landed
   * @returns {boolean} True if an entry step was triggered
   */
  const triggerEntryStep = (mapId: number, spawnPos: Position) => {
    if (gameStore.currentMapId !== mapId) return false;

    const currentMapData = ALL_MAPS.find(m => m.id === mapId);
    if (!currentMapData) return false;

    const tileGrid = TILE_GRIDS[currentMapData.gridDataFile];
    const gridX = Math.floor(spawnPos.x / TILE_SIZE);
    const gridY = Math.floor(spawnPos.y / TILE_SIZE);

    const directions: { x: number, y: number, dir: Direction }[] = [
        { x: 0, y: 1, dir: 'down' },
        { x: 0, y: -1, dir: 'up' }
    ];

    for (const d of directions) {
        const tx = gridX + d.x;
        const ty = gridY + d.y;
        if (tileGrid && ty >= 0 && ty < tileGrid.length && tx >= 0 && tx < tileGrid[0].length) {
            const tile = tileGrid[ty][tx];
            if (tile === TileType.WALKABLE || tile === TileType.WATER) {
                isAutoSteppingRef.current = true;
                autoStepDirRef.current = d.dir;
                return true;
            }
        }
    }
    return false;
  };

  /**
   * Teleports the player to a new position on the same map with a fade effect,
   * keeping the current NPCs and Pokemon state intact.
   * 
   * @param targetPos - The pixel position to move the player to.
   */
  const teleportPlayer = useCallback((targetPos: Position) => {
    gameStore.setGameState(prev => ({ ...prev, isTransitioning: true, transitionType: 'circle' }));

    setTimeout(() => {
        const newPlayer = {
          ...playerRef.current,
          pos: { ...targetPos },
          isMoving: false,
          bumpOffset: { x: 0, y: 0 }
        };

        playerRef.current = newPlayer;
        initCollisionMap(newPlayer, npcsRef.current, itemsRef.current);

        gameStore.setGameState(prev => ({
          ...prev,
          player: newPlayer,
          isTalking: false,
          talkingNPCId: null,
          talkingItemId: null,
          activeDialogue: null,
          dialogueIndex: 0
        }));

        startPosRef.current = { ...targetPos };
        targetPosRef.current = { ...targetPos };

        setTimeout(() => {
            gameStore.setGameState(prev => ({ ...prev, isTransitioning: false }));

            const triggered = triggerEntryStep(gameStore.currentMapId, targetPos);
            if (triggered) {
                setTimeout(() => {
                    isAutoSteppingRef.current = false;
                }, MOVE_DURATION + 100);
            }
        }, 200);
    }, 400);
  }, [playerRef, npcsRef, itemsRef, initCollisionMap, startPosRef, targetPosRef]);

  const changeMap = useCallback((mapId: number, spawnPos?: Position, skipEntryAnimation: boolean = false) => {
    const targetMap = ALL_MAPS.find(m => m.id === mapId);
    if (!targetMap) return;

    gameStore.setGameState(prev => ({ ...prev, isTransitioning: true, transitionType: 'fade' }));

    setTimeout(() => {
        const { npcs, items, playerPos: newPlayerPos } = prepareMapData(
          mapId, 
          gameStore.collectedItemIds, 
          playerRef.current, 
          spawnPos, 
          gameStore.mapReturnPositions
        );

        const newPlayer = {
          ...playerRef.current,
          pos: newPlayerPos,
          isMoving: false,
          bumpOffset: { x: 0, y: 0 }
        };

        playerRef.current = newPlayer;
        npcsRef.current = npcs;
        itemsRef.current = items;
        initCollisionMap(newPlayer, npcs, items);

        gameStore.setGameState(prev => ({
          ...prev,
          player: newPlayer,
          npcs: npcs,
          items: items,
          currentMapId: mapId,
          previousMapId: prev.currentMapId,
          isTalking: false,
          talkingNPCId: null,
          talkingItemId: null,
          activeDialogue: null,
          dialogueIndex: 0,
          mapReturnPositions: {
            ...prev.mapReturnPositions,
            [prev.currentMapId]: { ...prev.player.pos }
          }
        }));

        startPosRef.current = newPlayerPos;
        targetPosRef.current = newPlayerPos;

        setTimeout(() => {
            gameStore.setGameState(prev => ({ ...prev, isTransitioning: false }));

            if (!skipEntryAnimation) {
              const triggered = triggerEntryStep(mapId, newPlayerPos);
              if (triggered) {
                setTimeout(() => {
                  isAutoSteppingRef.current = false;
                }, MOVE_DURATION + 100);
              }
            }
        }, 200);
    }, 400);
  }, [initCollisionMap, playerRef, npcsRef, itemsRef, startPosRef, targetPosRef]);

  return {
    changeMap,
    teleportPlayer,
    isAutoSteppingRef,
    autoStepDirRef
  };
}
