import { useCallback, useRef, Dispatch, SetStateAction, MutableRefObject } from 'react';
import { Position, Entity, Item, GameState, MapConfig, TileType, Direction } from '../types';
import { TILE_SIZE, MOVE_DURATION } from '../constants';
import { ALL_MAPS } from '../data/maps';
import { TILE_GRIDS } from '../lib/gameLogic';
import { prepareMapData } from '../lib/mapLogic';

interface MapSystemProps {
  setGameState: Dispatch<SetStateAction<GameState>>;
  stateRef: MutableRefObject<GameState>;
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
  setGameState,
  stateRef,
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
    if (stateRef.current.currentMapId !== mapId) return false;

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
            if (tileGrid[ty][tx] === TileType.WALKABLE) {
                isAutoSteppingRef.current = true;
                autoStepDirRef.current = d.dir;
                return true;
            }
        }
    }
    return false;
  };

  const changeMap = useCallback((mapId: number, spawnPos?: Position, skipEntryAnimation: boolean = false) => {
    const targetMap = ALL_MAPS.find(m => m.id === mapId);
    if (!targetMap) return;

    setGameState(prev => ({ ...prev, isTransitioning: true }));

    setTimeout(() => {
        const { npcs, items, playerPos: newPlayerPos } = prepareMapData(
          mapId, 
          stateRef.current.collectedItemIds, 
          playerRef.current, 
          spawnPos, 
          stateRef.current.mapReturnPositions
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

        setGameState(prev => ({
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
            setGameState(prev => ({ ...prev, isTransitioning: false }));

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
  }, [initCollisionMap, setGameState, stateRef, playerRef, npcsRef, itemsRef, startPosRef, targetPosRef]);

  return {
    changeMap,
    isAutoSteppingRef,
    autoStepDirRef
  };
}
