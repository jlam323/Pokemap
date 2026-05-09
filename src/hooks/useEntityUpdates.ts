import { useCallback, useRef, MutableRefObject } from 'react';
import { GameState, Entity, Direction, Position, Habitat, TileType, EntityType, MovementType } from '../types';
import { TILE_SIZE, MOVE_DURATION, BUMP_DURATION, BUMP_DISTANCE } from '../constants';
import { ALL_MAPS } from '../data/maps';
import { TILE_GRIDS } from '../lib/gameLogic';

interface EntityUpdateProps {
  stateRef: MutableRefObject<GameState>;
  playerRef: MutableRefObject<Entity>;
  npcsRef: MutableRefObject<Entity[]>;
  collisionMapRef: MutableRefObject<Set<string>>;
  changeMap: (mapId: number, spawnPos?: Position, skipEntryAnimation?: boolean) => void;
  isAutoSteppingRef: MutableRefObject<boolean>;
  autoStepDirRef: MutableRefObject<Direction | null>;
  keysPressed: MutableRefObject<Set<string>>;
}

/**
 * Core engine hook for updating entity positions and animations.
 * 
 * This hook contains the logic for:
 * - NPC autonomous movement (Random wandering)
 * - Player movement interpolation
 * - Collision detection during movement
 * - Tile-based portal triggers
 * - Animation frame cycling (Walking/Surfing)
 * - "Bump" animation when hitting obstacles
 * 
 * @param props - References and functions needed to perform physical updates.
 * @returns {Object} Update functions for NPCs and Player.
 */
export function useEntityUpdates({
	stateRef,
	playerRef,
	npcsRef,
	collisionMapRef,
	changeMap,
	isAutoSteppingRef,
	autoStepDirRef,
	keysPressed,
	startPosRef,
	targetPosRef
}: EntityUpdateProps & { 
	startPosRef: MutableRefObject<Position>; 
	targetPosRef: MutableRefObject<Position>; 
}) {
	const moveTimerRef = useRef<number>(0);
	const bobTimerRef = useRef<number>(0);
	const footCycleRef = useRef<number>(1);
	const bumpTimerRef = useRef<number>(0);
	const isBumpingRef = useRef<boolean>(false);

	/**
	 * Updates the positions and animation frames for all NPCs on the current map.
	 * 
	 * @param dt - Delta time since last frame
	 * @param isTalking - Whether the game is currently in a dialogue state
	 * @param isTransitioning - Whether a map transition is in progress
	 */
	const updateNPCs = useCallback((dt: number, isTalking: boolean, isTransitioning: boolean) => {
		if (isTalking || isTransitioning) return;

		npcsRef.current.forEach(npc => {
			if (npc.isMoving) {
				npc.moveProgress = (npc.moveProgress || 0) + dt / MOVE_DURATION;
				const progress = Math.min(npc.moveProgress, 1);
				
				npc.pos.x = npc.startPos!.x + (npc.targetPos!.x - npc.startPos!.x) * progress;
				npc.pos.y = npc.startPos!.y + (npc.targetPos!.y - npc.startPos!.y) * progress;
				
				if (progress >= 1) {
					collisionMapRef.current.delete(`${npc.startPos!.x},${npc.startPos!.y}`);
					npc.isMoving = false;
					npc.pos = { ...npc.targetPos! };
					npc.walkFrame = 0;
					npc.moveProgress = 0;
				} else {
					npc.walkFrame = (Math.floor(progress * 4) % 2) + 1;
				}
			} else if (npc.movementType === MovementType.RANDOM) {
				const moveInterval = npc.type === EntityType.POKEMON ? 3000 : 8000;
				npc.movementTimer = (npc.movementTimer || 0) + dt;
				if (npc.movementTimer >= moveInterval) {
					npc.movementTimer = 0;
					
					const directions: Direction[] = ['up', 'down', 'left', 'right'];
					const dir = directions[Math.floor(Math.random() * directions.length)];
					
					let nextX = npc.pos.x;
					let nextY = npc.pos.y;
					if (dir === 'up') nextY -= TILE_SIZE;
					else if (dir === 'down') nextY += TILE_SIZE;
					else if (dir === 'left') nextX -= TILE_SIZE;
					else if (dir === 'right') nextX += TILE_SIZE;

					const gridX = Math.floor(nextX / TILE_SIZE);
					const gridY = Math.floor(nextY / TILE_SIZE);
					
					const currentMapData = ALL_MAPS.find(m => m.id === stateRef.current.currentMapId) || ALL_MAPS[0];
					const mapWidth = currentMapData.overlays.none.width;
					const mapHeight = currentMapData.overlays.none.height;
					
					const inBounds = gridX >= 0 && gridX < mapWidth && gridY >= 0 && gridY < mapHeight;

					if (inBounds) {
						const tileGrid = TILE_GRIDS[currentMapData.gridDataFile];
						if (tileGrid) {
								const tileType = tileGrid[gridY][gridX];
								let habitatOk = false;
								const habitat = npc.movementHabitat || Habitat.GROUND;
								
								if (habitat === Habitat.FLYING) {
								habitatOk = (tileType === TileType.WALKABLE || tileType === TileType.WATER);
								} else if (habitat === Habitat.WATER) {
								habitatOk = (tileType === TileType.WATER);
								} else {
								habitatOk = (tileType === TileType.WALKABLE);
								}

								if (habitatOk) {
								const isOccupied = collisionMapRef.current.has(`${nextX},${nextY}`);
								if (!isOccupied) {
										collisionMapRef.current.add(`${nextX},${nextY}`);
										npc.dir = dir;
										npc.isMoving = true;
										npc.startPos = { ...npc.pos };
										npc.targetPos = { x: nextX, y: nextY };
										npc.moveProgress = 0;
								}
								}
						}
					}
				}
			}
		});
	}, [stateRef, npcsRef, collisionMapRef]);

	/**
	 * Updates the player's position, animation frame, and checks for tile triggers.
	 * 
	 * @param dt - Delta time since last frame
	 * @param isTalking - Whether a dialogue is active
	 * @param currentState - The full current game state for context
	 */
	const updatePlayer = useCallback((dt: number, isTalking: boolean, currentState: GameState) => {
    const player = playerRef.current;
    
    if (isTalking) return;
    if (currentState.isTransitioning && !isAutoSteppingRef.current) return;

    if (isBumpingRef.current) {
      bumpTimerRef.current += dt;
      const progress = Math.min(bumpTimerRef.current / BUMP_DURATION, 1);
      const offset = Math.sin(progress * Math.PI) * BUMP_DISTANCE;
      
      if (!player.bumpOffset) player.bumpOffset = { x: 0, y: 0 };
      
      if (player.dir === 'up') player.bumpOffset = { x: 0, y: -offset };
      else if (player.dir === 'down') player.bumpOffset = { x: 0, y: offset };
      else if (player.dir === 'left') player.bumpOffset = { x: -offset, y: 0 };
      else if (player.dir === 'right') player.bumpOffset = { x: offset, y: 0 };

      if (progress >= 1) {
        isBumpingRef.current = false;
        player.bumpOffset = { x: 0, y: 0 };
      }
      return;
    }

    if (player.isMoving) {
      moveTimerRef.current += dt;
      const progress = Math.min(moveTimerRef.current / MOVE_DURATION, 1);

      player.pos.x = startPosRef.current.x + (targetPosRef.current.x - startPosRef.current.x) * progress;
      player.pos.y = startPosRef.current.y + (targetPosRef.current.y - startPosRef.current.y) * progress;

      if (progress >= 1) {
        const oldX = startPosRef.current.x;
        const oldY = startPosRef.current.y;
        collisionMapRef.current.delete(`${oldX},${oldY}`);

        player.isMoving = false;
        player.pos = { ...targetPosRef.current };
        player.walkFrame = player.isSurfing ? footCycleRef.current : 0;

        const gridX = Math.round(player.pos.x / TILE_SIZE);
        const gridY = Math.round(player.pos.y / TILE_SIZE);
        const currentMapData = ALL_MAPS.find(m => m.id === stateRef.current.currentMapId) || ALL_MAPS[0];
        const tileGrid = TILE_GRIDS[currentMapData.gridDataFile];
        
        if (tileGrid && tileGrid[gridY]) {
          const tileValue = tileGrid[gridY][gridX];
          if (tileValue === TileType.PORTAL_BACK) {
            const prevMapId = stateRef.current.previousMapId;
            if (prevMapId !== null) {
              changeMap(prevMapId);
            }
          } else if (tileValue >= TileType.PORTAL_MIN) {
            changeMap(tileValue);
          }
        }
      }
    } else {
      if (player.isSurfing) {
        bobTimerRef.current += dt;
        if (bobTimerRef.current >= 750) {
          bobTimerRef.current -= 750;
          footCycleRef.current = footCycleRef.current === 1 ? 2 : 1;
          player.walkFrame = footCycleRef.current;
        }
      } else {
        bobTimerRef.current = 0;
      }

      let nextGridX = player.pos.x;
      let nextGridY = player.pos.y;
      let newDir = player.dir;
      let moving = false;

      let moveDir: Direction | null = null;
      if (autoStepDirRef.current) {
        moveDir = autoStepDirRef.current;
        autoStepDirRef.current = null;
      } else if (!currentState.isTransitioning && !isAutoSteppingRef.current) {
        const keys = keysPressed.current;
        if (keys.has('w') || keys.has('arrowup')) moveDir = 'up';
        else if (keys.has('s') || keys.has('arrowdown')) moveDir = 'down';
        else if (keys.has('a') || keys.has('arrowleft')) moveDir = 'left';
        else if (keys.has('d') || keys.has('arrowright')) moveDir = 'right';
      }

      if (moveDir === 'up') {
        nextGridY -= TILE_SIZE;
        newDir = 'up';
        moving = true;
      } else if (moveDir === 'down') {
        nextGridY += TILE_SIZE;
        newDir = 'down';
        moving = true;
      } else if (moveDir === 'left') {
        nextGridX -= TILE_SIZE;
        newDir = 'left';
        moving = true;
      } else if (moveDir === 'right') {
        nextGridX += TILE_SIZE;
        newDir = 'right';
        moving = true;
      }

      if (moving) {
        player.dir = newDir;
        const gridX = Math.floor(nextGridX / TILE_SIZE);
        const gridY = Math.floor(nextGridY / TILE_SIZE);
        const currentMapData = ALL_MAPS.find(m => m.id === stateRef.current.currentMapId) || ALL_MAPS[0];
        const mapWidth = currentMapData.overlays.none.width;
        const mapHeight = currentMapData.overlays.none.height;

        const inBounds = gridX >= 0 && gridX < mapWidth && gridY >= 0 && gridY < mapHeight;

        let canMove = inBounds;
        let enteringWater = false;

        if (inBounds) {
          const tileGrid = TILE_GRIDS[currentMapData.gridDataFile];
          if (tileGrid) {
            const tileType = tileGrid[gridY][gridX];
            if (tileType === TileType.BLOCKED) {
                canMove = false;
            } else if (tileType === TileType.WATER) {
                enteringWater = true;
            }
          }
        }

        const isOccupied = collisionMapRef.current.has(`${nextGridX},${nextGridY}`);
        
        if (canMove && !isOccupied) {
          collisionMapRef.current.add(`${nextGridX},${nextGridY}`);
          bobTimerRef.current = 0;
          footCycleRef.current = footCycleRef.current === 1 ? 2 : 1;
          player.walkFrame = footCycleRef.current;
          player.isMoving = true;
          player.isSurfing = enteringWater;
          moveTimerRef.current = 0;
          startPosRef.current = { ...player.pos };
          targetPosRef.current = { x: nextGridX, y: nextGridY };
        } else {
          isBumpingRef.current = true;
          bumpTimerRef.current = 0;
        }
      }
    }
  }, [changeMap, playerRef, collisionMapRef, stateRef, isAutoSteppingRef, autoStepDirRef, keysPressed]);

  return {
    updateNPCs,
    updatePlayer,
    startPosRef,
    targetPosRef
  };
}
