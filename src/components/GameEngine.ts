import { useRef, useState, useEffect, useCallback } from 'react';
import { Entity, GameState, Position, Direction, MapConfig, Item } from '../types';
import { TILE_SIZE, MOVE_DURATION, BUMP_DURATION, BUMP_DISTANCE } from '../constants';
import { INITIAL_NPCS } from '../data/npcs';
import { INITIAL_PLAYER } from '../data/player';
import { INITIAL_ITEMS } from '../data/items';
import mapsData from '../data/maps.json';
import mapTileGridMain from '../data/mapTileGrid/kanto.json';
import mapTileGridPokeCenter from '../data/mapTileGrid/pokemon-center.json';
import mapTileGridPokeMart from '../data/mapTileGrid/pokemart.json';
import { findNearbyNPC, findNearbyItem } from '../lib/gameUtils';

const MAPS = mapsData as MapConfig[];
const TILE_GRIDS: Record<string, number[][]> = {
  'kanto.json': mapTileGridMain,
  'pokemon-center.json': mapTileGridPokeCenter,
  'pokemart.json': mapTileGridPokeMart
};

export function GameEngine() {
  const [gameState, setGameState] = useState<GameState>(() => {
    const initialMap = MAPS[0];
    const filteredNpcs = INITIAL_NPCS.filter(npc => npc.mapId === initialMap.id);
    const filteredItems = INITIAL_ITEMS.filter(item => item.mapId === initialMap.id);
    const playerWithStartPos = {
      ...INITIAL_PLAYER,
      pos: { 
        x: initialMap.startPos.x * TILE_SIZE, 
        y: initialMap.startPos.y * TILE_SIZE 
      }
    };

    return {
      player: playerWithStartPos,
      npcs: filteredNpcs,
      items: filteredItems,
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
  });

  const playerRef = useRef<Entity>(gameState.player);
  const npcsRef = useRef<Entity[]>(gameState.npcs);
  const itemsRef = useRef<Item[]>(gameState.items);
  const stateRef = useRef<GameState>(gameState);
  const collisionMapRef = useRef<Set<string>>(new Set());

  const currentMap = MAPS.find(m => m.id === gameState.currentMapId) || MAPS[0];

  // Initialize collision map
  const initCollisionMap = useCallback((player: Entity, npcs: Entity[], items: Item[]) => {
    const map = new Set<string>();
    map.add(`${player.pos.x},${player.pos.y}`);
    npcs.forEach(npc => {
      map.add(`${npc.pos.x},${npc.pos.y}`);
    });
    items.forEach(item => {
      if (!item.isCollected) {
        map.add(`${item.pos.x},${item.pos.y}`);
      }
    });
    collisionMapRef.current = map;
  }, []);

  useEffect(() => {
    initCollisionMap(gameState.player, gameState.npcs, gameState.items);
  }, []);

  const changeMap = useCallback((mapId: number, spawnPos?: Position, skipEntryAnimation: boolean = false) => {
    const targetMap = MAPS.find(m => m.id === mapId);
    if (!targetMap) return;

    // Start fade out
    setGameState(prev => ({ ...prev, isTransitioning: true }));

    // Wait for fade out duration
    setTimeout(() => {
        const filteredNpcs = INITIAL_NPCS.filter(npc => npc.mapId === targetMap.id);
        const collectedIds = stateRef.current.collectedItemIds;
        const filteredItems = INITIAL_ITEMS.filter(item => 
          item.mapId === targetMap.id && !collectedIds.includes(item.id)
        );
        
        let newPlayerPos = spawnPos || (stateRef.current.mapReturnPositions[mapId] ? { ...stateRef.current.mapReturnPositions[mapId] } : {
          x: targetMap.startPos.x * TILE_SIZE,
          y: targetMap.startPos.y * TILE_SIZE
        });

        const newPlayer = {
          ...playerRef.current,
          pos: newPlayerPos,
          isMoving: false,
          bumpOffset: { x: 0, y: 0 }
        };

        playerRef.current = newPlayer;
        npcsRef.current = filteredNpcs;
        itemsRef.current = filteredItems;
        initCollisionMap(newPlayer, filteredNpcs, filteredItems);

        setGameState(prev => ({
          ...prev,
          player: newPlayer,
          npcs: filteredNpcs,
          items: filteredItems,
          currentMapId: mapId,
          previousMapId: prev.currentMapId,
          isTalking: false,
          talkingNPCId: null,
          talkingItemId: null,
          activeDialogue: null,
          dialogueIndex: 0,
          // Save current position of PREVIOUS map as its return position
          mapReturnPositions: {
            ...prev.mapReturnPositions,
            [prev.currentMapId]: { ...prev.player.pos }
          }
        }));

        startPosRef.current = newPlayerPos;
        targetPosRef.current = newPlayerPos;

        // Smoothly end transition after map update
        setTimeout(() => {
            setGameState(prev => ({ ...prev, isTransitioning: false }));

            // Trigger entry sequence (auto-step)
            if (!skipEntryAnimation) {
              const triggered = triggerEntryStep(mapId, newPlayerPos);
              if (triggered) {
                // Wait for the auto-step move to complete + buffer
                setTimeout(() => {
                  isAutoSteppingRef.current = false;
                }, MOVE_DURATION + 100);
              }
            }
        }, 200);
    }, 400);
  }, [initCollisionMap]);

  const isAutoSteppingRef = useRef(false);
  const autoStepDirRef = useRef<Direction | null>(null);

  const triggerEntryStep = (mapId: number, spawnPos: Position) => {
    if (stateRef.current.currentMapId !== mapId) return false;

    const currentMapData = MAPS.find(m => m.id === mapId);
    if (!currentMapData) return false;

    const tileGrid = TILE_GRIDS[currentMapData.gridDataFile];
    const gridX = Math.floor(spawnPos.x / TILE_SIZE);
    const gridY = Math.floor(spawnPos.y / TILE_SIZE);

    // Try walking down first, then up
    const directions: { x: number, y: number, dir: Direction }[] = [
        { x: 0, y: 1, dir: 'down' },
        { x: 0, y: -1, dir: 'up' }
    ];

    for (const d of directions) {
        const tx = gridX + d.x;
        const ty = gridY + d.y;
        if (ty >= 0 && ty < tileGrid.length && tx >= 0 && tx < tileGrid[0].length) {
            if (tileGrid[ty][tx] === 0) {
                isAutoSteppingRef.current = true;
                autoStepDirRef.current = d.dir;
                return true;
            }
        }
    }
    return false;
  };
  const keysPressed = useRef<Set<string>>(new Set());
  const moveTimerRef = useRef<number>(0);
  const bobTimerRef = useRef<number>(0);
  const footCycleRef = useRef<number>(1);
  const startPosRef = useRef<Position>(INITIAL_PLAYER.pos);
  const targetPosRef = useRef<Position>(INITIAL_PLAYER.pos);
  const bumpTimerRef = useRef<number>(0);
  const isBumpingRef = useRef<boolean>(false);

  useEffect(() => {
    stateRef.current = gameState;
  }, [gameState]);

  const triggerNPCAction = useCallback((npcId: string) => {
    setGameState(prev => {
      const npcIndex = prev.npcs.findIndex(n => n.id === npcId);
      if (npcIndex === -1) return prev;

      const newNpcs = [...prev.npcs];
      newNpcs[npcIndex] = { ...newNpcs[npcIndex], isActionActive: true };
      
      // Update ref for persistence
      if (npcsRef.current[npcIndex]) {
        npcsRef.current[npcIndex].isActionActive = true;
      }

      // Clear action after brief delay
      setTimeout(() => {
        setGameState(s => {
          const updatedNpcs = [...s.npcs];
          const idx = updatedNpcs.findIndex(n => n.id === npcId);
          if (idx !== -1) {
            updatedNpcs[idx] = { ...updatedNpcs[idx], isActionActive: false };
            if (npcsRef.current[idx]) {
              npcsRef.current[idx].isActionActive = false;
            }
          }
          return { ...s, npcs: updatedNpcs };
        });
      }, 800);

      return { ...prev, npcs: newNpcs };
    });
  }, []);

  const nextDialogue = useCallback(() => {
    setGameState(prev => {
      if (!prev.activeDialogue) return prev;
      if (prev.dialogueIndex < prev.activeDialogue.length - 1) {
        return { ...prev, dialogueIndex: prev.dialogueIndex + 1 };
      } else {
        // Handle item collection
        if (prev.talkingItemId) {
          const itemId = prev.talkingItemId;
          const updatedItems = prev.items.filter(item => item.id !== itemId);
          const newCollectedIds = [...prev.collectedItemIds, itemId];
          
          // Update ref
          itemsRef.current = itemsRef.current.filter(item => item.id !== itemId);
          
          // Re-init collisions without the item
          initCollisionMap(playerRef.current, npcsRef.current, itemsRef.current);

          return { 
            ...prev, 
            isTalking: false, 
            talkingItemId: null, 
            activeDialogue: null, 
            dialogueIndex: 0,
            items: updatedItems,
            collectedItemIds: newCollectedIds,
            hasInteractedWithItem: true
          };
        }

        // Handle shopkeeper action sprite on final dialogue
        const talkingNPCId = prev.talkingNPCId;
        const talkingNPCIndex = prev.npcs.findIndex(n => n.id === talkingNPCId);
        if (talkingNPCId && talkingNPCIndex !== -1) {
          const npc = prev.npcs[talkingNPCIndex];
          if (npc.npcType === 'shopkeeper' && npc.actionTrigger === 'end') {
            triggerNPCAction(talkingNPCId);
          }
        }

        return { ...prev, isTalking: false, talkingNPCId: null, activeDialogue: null, dialogueIndex: 0, hasInteractedWithNPC: true };
      }
    });
  }, [initCollisionMap, triggerNPCAction]);

  const handleInteraction = useCallback(() => {
    const currentState = stateRef.current;
    if (currentState.isTalking) {
      nextDialogue();
      return;
    }

    if (currentState.isTransitioning) return;

    const player = playerRef.current;
    
    const nearbyNPCResult = findNearbyNPC(npcsRef.current, player.pos, player.dir);
    const nearbyNPCIndex = nearbyNPCResult ? nearbyNPCResult.index : -1;

      if (nearbyNPCIndex !== -1) {
      const nearbyNPC = npcsRef.current[nearbyNPCIndex];
      
      // Make NPC look at player ONLY if not a shopkeeper
      let newDir: Direction = nearbyNPC.dir;
      if (nearbyNPC.npcType !== 'shopkeeper') {
        const dx = player.pos.x - nearbyNPC.pos.x;
        const dy = player.pos.y - nearbyNPC.pos.y;
        
        if (Math.abs(dx) > Math.abs(dy)) {
          newDir = dx > 0 ? 'right' : 'left';
        } else {
          newDir = dy > 0 ? 'down' : 'up';
        }
        // Update ref immediately for the renderer
        npcsRef.current[nearbyNPCIndex].dir = newDir;
      }

      const dialogueGroups = nearbyNPC.dialogue || [];
      const groupIndex = nearbyNPC.dialogueGroupIndex || 0;
      const currentDialogueGroup = dialogueGroups[groupIndex % dialogueGroups.length] || [];

      // Trigger start action if applicable
      if (nearbyNPC.npcType === 'shopkeeper' && nearbyNPC.actionTrigger === 'start') {
        triggerNPCAction(nearbyNPC.id);
      }

      setGameState(prev => {
        const newNpcs = [...prev.npcs];
        // Increment dialogue group for next time
        newNpcs[nearbyNPCIndex] = { 
          ...newNpcs[nearbyNPCIndex], 
          dir: newDir,
          dialogueGroupIndex: (groupIndex + 1) % dialogueGroups.length
        };
        // Also update the ref for persistence across renders
        npcsRef.current[nearbyNPCIndex].dialogueGroupIndex = newNpcs[nearbyNPCIndex].dialogueGroupIndex;

        return {
          ...prev,
          npcs: newNpcs,
          isTalking: true,
          talkingNPCId: nearbyNPC.id,
          activeDialogue: currentDialogueGroup,
          dialogueIndex: 0,
          hasInteractedWithNPC: true
        };
      });
    } else {
      // Check for items
      const nearbyItemResult = findNearbyItem(itemsRef.current, player.pos, player.dir);
      const nearbyItemIndex = nearbyItemResult ? nearbyItemResult.index : -1;

      if (nearbyItemIndex !== -1) {
        const item = itemsRef.current[nearbyItemIndex];
        setGameState(prev => ({
          ...prev,
          isTalking: true,
          talkingItemId: item.id,
          activeDialogue: item.dialogue,
          dialogueIndex: 0,
          hasInteractedWithItem: true
        }));
      }
    }
  }, [nextDialogue]);

  const updateNPCs = useCallback((dt: number, isTalking: boolean, isTransitioning: boolean) => {
    npcsRef.current.forEach(npc => {
      // Don't move if talking or transitioning
      if (isTalking || isTransitioning) return;

      if (npc.isMoving) {
        npc.moveProgress = (npc.moveProgress || 0) + dt / MOVE_DURATION;
        if (npc.moveProgress >= 1) {
          const oldX = npc.startPos!.x;
          const oldY = npc.startPos!.y;
          collisionMapRef.current.delete(`${oldX},${oldY}`);

          npc.isMoving = false;
          npc.pos = { ...npc.targetPos! };
          npc.walkFrame = 0;
          npc.moveProgress = 0;
        } else {
          npc.pos.x = npc.startPos!.x + (npc.targetPos!.x - npc.startPos!.x) * npc.moveProgress;
          npc.pos.y = npc.startPos!.y + (npc.targetPos!.y - npc.startPos!.y) * npc.moveProgress;
          // Cycle walk frame during move
          npc.walkFrame = (Math.floor(npc.moveProgress * 4) % 2) + 1;
        }
      } else if (npc.movementType === 'random') {
        npc.movementTimer = (npc.movementTimer || 0) + dt;
        if (npc.movementTimer >= 10000) {
          npc.movementTimer = 0;
          
          // Pick random direction
          const directions: Direction[] = ['up', 'down', 'left', 'right'];
          const dir = directions[Math.floor(Math.random() * directions.length)];
          
          let nextX = npc.pos.x;
          let nextY = npc.pos.y;
          if (dir === 'up') nextY -= TILE_SIZE;
          else if (dir === 'down') nextY += TILE_SIZE;
          else if (dir === 'left') nextX -= TILE_SIZE;
          else if (dir === 'right') nextX += TILE_SIZE;

          // Check walkability
          const gridX = Math.floor(nextX / TILE_SIZE);
          const gridY = Math.floor(nextY / TILE_SIZE);
          
          const currentMapData = MAPS.find(m => m.id === stateRef.current.currentMapId) || MAPS[0];
          const mapWidth = currentMapData.overlays.none.width;
          const mapHeight = currentMapData.overlays.none.height;
          
          const inBounds = gridX >= 0 && gridX < mapWidth && gridY >= 0 && gridY < mapHeight;

          const tileGrid = TILE_GRIDS[currentMapData.gridDataFile];
          if (inBounds && tileGrid[gridY][gridX] === 0) {
            const isOccupied = collisionMapRef.current.has(`${nextX},${nextY}`);

            if (!isOccupied) {
              // Reserve target
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
    });
  }, []);

  const updatePlayer = useCallback((dt: number, isTalking: boolean, currentState: GameState) => {
    const player = playerRef.current;
    
    if (isTalking) return;
    // Block input during transition, but allow auto-step
    if (currentState.isTransitioning && !isAutoSteppingRef.current) return;

    if (isBumpingRef.current) {
      bumpTimerRef.current += dt;
      const progress = Math.min(bumpTimerRef.current / BUMP_DURATION, 1);
      
      // Sine wave for the bump: 0 -> max -> 0
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

        // Check for map transition
        const gridX = Math.round(player.pos.x / TILE_SIZE);
        const gridY = Math.round(player.pos.y / TILE_SIZE);
        const currentMapData = MAPS.find(m => m.id === stateRef.current.currentMapId) || MAPS[0];
        const tileGrid = TILE_GRIDS[currentMapData.gridDataFile];
        
        if (tileGrid && tileGrid[gridY]) {
          const tileValue = tileGrid[gridY][gridX];
          if (tileValue === 99) {
            const prevMapId = stateRef.current.previousMapId;
            if (prevMapId !== null) {
              changeMap(prevMapId);
            }
          } else if (tileValue >= 10) {
            changeMap(tileValue);
          }
        }
      }
    } else {
      // Bobbing logic for surfing
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
        
        const currentMapData = MAPS.find(m => m.id === stateRef.current.currentMapId) || MAPS[0];
        const mapWidth = currentMapData.overlays.none.width;
        const mapHeight = currentMapData.overlays.none.height;

        const inBounds = gridX >= 0 && gridX < mapWidth &&
                         gridY >= 0 && gridY < mapHeight;

        let canMove = inBounds;
        let enteringWater = false;

        if (inBounds) {
          const tileGrid = TILE_GRIDS[currentMapData.gridDataFile];
          const tileType = tileGrid[gridY][gridX];
          if (tileType === 1) {
            canMove = false;
          } else if (tileType === 2) {
            enteringWater = true;
          }
        }

        const isOccupied = collisionMapRef.current.has(`${nextGridX},${nextGridY}`);
        
        if (canMove && !isOccupied) {
          // Reserve target
          collisionMapRef.current.add(`${nextGridX},${nextGridY}`);

          // Reset bob timer when starting a move
          bobTimerRef.current = 0;
          
          // Toggle foot cycle for every step taken
          footCycleRef.current = footCycleRef.current === 1 ? 2 : 1;
          player.walkFrame = footCycleRef.current;

          player.isMoving = true;
          player.isSurfing = enteringWater;
          moveTimerRef.current = 0;
          startPosRef.current = { ...player.pos };
          targetPosRef.current = { x: nextGridX, y: nextGridY };
        } else {
          // Trigger bump animation
          isBumpingRef.current = true;
          bumpTimerRef.current = 0;
        }
      }
    }
  }, [changeMap]);

  const update = useCallback((dt: number) => {
    const currentState = stateRef.current;
    updateNPCs(dt, currentState.isTalking, currentState.isTransitioning);
    updatePlayer(dt, currentState.isTalking, currentState);
  }, [updateNPCs, updatePlayer]);

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
    currentMap
  };
}
