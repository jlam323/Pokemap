import { useRef, useState, useEffect, useCallback } from 'react';
import { Entity, GameState, Position, Direction, MapConfig } from '../types';
import { TILE_SIZE, MOVE_DURATION, BUMP_DURATION, BUMP_DISTANCE } from '../constants';
import { INITIAL_NPCS } from '../data/npcs';
import { INITIAL_PLAYER } from '../data/player';
import mapsData from '../data/maps.json';
import mapTileGridMain from '../data/cerulean-city-map-tile-grid.json';
import mapTileGridPokeCenter from '../data/pokemon-center-map-tile-grid.json';

const MAPS = mapsData as MapConfig[];
const TILE_GRIDS: Record<string, number[][]> = {
  'cerulean-city-map-tile-grid.json': mapTileGridMain,
  'pokemon-center-map-tile-grid.json': mapTileGridPokeCenter
};

export function GameEngine() {
  const [gameState, setGameState] = useState<GameState>(() => {
    const initialMap = MAPS[0];
    const filteredNpcs = INITIAL_NPCS.filter(npc => npc.mapId === initialMap.id);
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
      isTalking: false,
      talkingNPCId: null,
      activeDialogue: null,
      dialogueIndex: 0,
      currentMapId: initialMap.id,
      mapReturnPositions: {},
      isTransitioning: false
    };
  });

  const playerRef = useRef<Entity>(gameState.player);
  const npcsRef = useRef<Entity[]>(gameState.npcs);
  const stateRef = useRef<GameState>(gameState);
  const collisionMapRef = useRef<Set<string>>(new Set());

  const currentMap = MAPS.find(m => m.id === gameState.currentMapId) || MAPS[0];

  // Initialize collision map
  const initCollisionMap = useCallback((player: Entity, npcs: Entity[]) => {
    const map = new Set<string>();
    map.add(`${player.pos.x},${player.pos.y}`);
    npcs.forEach(npc => {
      map.add(`${npc.pos.x},${npc.pos.y}`);
    });
    collisionMapRef.current = map;
  }, []);

  useEffect(() => {
    initCollisionMap(gameState.player, gameState.npcs);
  }, []);

  const changeMap = useCallback((mapId: number, spawnPos?: Position, skipEntryAnimation: boolean = false) => {
    const targetMap = MAPS.find(m => m.id === mapId);
    if (!targetMap) return;

    // Start fade out
    setGameState(prev => ({ ...prev, isTransitioning: true }));

    // Wait for fade out duration
    setTimeout(() => {
        const filteredNpcs = INITIAL_NPCS.filter(npc => npc.mapId === targetMap.id);
        
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
        initCollisionMap(newPlayer, filteredNpcs);

        setGameState(prev => ({
          ...prev,
          player: newPlayer,
          npcs: filteredNpcs,
          currentMapId: mapId,
          isTalking: false,
          talkingNPCId: null,
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
              setTimeout(() => {
                  triggerEntryStep(mapId, newPlayerPos);
              }, 300);
            }
        }, 200);
    }, 400);
  }, [initCollisionMap]);

  const triggerEntryStep = (mapId: number, spawnPos: Position) => {
    if (stateRef.current.currentMapId !== mapId) return;

    const currentMapData = MAPS.find(m => m.id === mapId);
    if (!currentMapData) return;

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
                // Simulate key press to move
                const keyMap: Record<Direction, string> = {
                    up: 'arrowup',
                    down: 'arrowdown',
                    left: 'arrowleft',
                    right: 'arrowright'
                };
                keysPressed.current.add(keyMap[d.dir]);
                setTimeout(() => {
                    keysPressed.current.delete(keyMap[d.dir]);
                }, 100);
                break;
            }
        }
    }
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

  const nextDialogue = useCallback(() => {
    setGameState(prev => {
      if (!prev.activeDialogue) return prev;
      if (prev.dialogueIndex < prev.activeDialogue.length - 1) {
        return { ...prev, dialogueIndex: prev.dialogueIndex + 1 };
      } else {
        // Handle shopkeeper action sprite on final dialogue
        const talkingNPCId = prev.talkingNPCId;
        const talkingNPCIndex = prev.npcs.findIndex(n => n.id === talkingNPCId);
        if (talkingNPCIndex !== -1 && prev.npcs[talkingNPCIndex].npcType === 'shopkeeper') {
          const newNpcs = [...prev.npcs];
          newNpcs[talkingNPCIndex] = { ...newNpcs[talkingNPCIndex], isActionActive: true };
          
          // Clear action after brief delay
          setTimeout(() => {
            setGameState(s => {
              const updatedNpcs = [...s.npcs];
              const idx = updatedNpcs.findIndex(n => n.id === talkingNPCId);
              if (idx !== -1) {
                updatedNpcs[idx] = { ...updatedNpcs[idx], isActionActive: false };
                if (npcsRef.current[idx]) {
                  npcsRef.current[idx].isActionActive = false;
                }
              }
              return { ...s, npcs: updatedNpcs };
            });
          }, 800);

          // Update ref for persistence
          npcsRef.current[talkingNPCIndex].isActionActive = true;

          return { ...prev, isTalking: false, talkingNPCId: null, activeDialogue: null, dialogueIndex: 0, npcs: newNpcs };
        }

        return { ...prev, isTalking: false, talkingNPCId: null, activeDialogue: null, dialogueIndex: 0 };
      }
    });
  }, []);

  const handleInteraction = useCallback(() => {
    const currentState = stateRef.current;
    if (currentState.isTalking) {
      nextDialogue();
      return;
    }

    const player = playerRef.current;
    
    // Calculate target position in front of player
    let targetX = player.pos.x;
    let targetY = player.pos.y;
    
    if (player.dir === 'up') targetY -= TILE_SIZE;
    else if (player.dir === 'down') targetY += TILE_SIZE;
    else if (player.dir === 'left') targetX -= TILE_SIZE;
    else if (player.dir === 'right') targetX += TILE_SIZE;

    // Check 1 cell away first
    let nearbyNPCIndex = npcsRef.current.findIndex(npc => {
      const nx = Math.round(npc.pos.x);
      const ny = Math.round(npc.pos.y);
      const tx = Math.round(targetX);
      const ty = Math.round(targetY);
      return nx === tx && ny === ty;
    });

    // If not found, check 2 cells away for shopkeepers
    if (nearbyNPCIndex === -1) {
      let farTargetX = player.pos.x;
      let farTargetY = player.pos.y;
      if (player.dir === 'up') farTargetY -= TILE_SIZE * 2;
      else if (player.dir === 'down') farTargetY += TILE_SIZE * 2;
      else if (player.dir === 'left') farTargetX -= TILE_SIZE * 2;
      else if (player.dir === 'right') farTargetX += TILE_SIZE * 2;

      nearbyNPCIndex = npcsRef.current.findIndex(npc => {
        if (npc.npcType !== 'shopkeeper') return false;
        const nx = Math.round(npc.pos.x);
        const ny = Math.round(npc.pos.y);
        const ftx = Math.round(farTargetX);
        const fty = Math.round(farTargetY);
        return nx === ftx && ny === fty;
      });
    }

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
          dialogueIndex: 0
        };
      });
    }
  }, [nextDialogue]);

  const updateNPCs = useCallback((dt: number, isTalking: boolean) => {
    npcsRef.current.forEach(npc => {
      // Don't move if talking
      if (isTalking) return;

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
        
        if (tileGrid && tileGrid[gridY] && tileGrid[gridY][gridX] >= 10) {
          const targetMapId = tileGrid[gridY][gridX];
          changeMap(targetMapId);
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

      const keys = keysPressed.current;
      if (keys.has('w') || keys.has('arrowup')) {
        nextGridY -= TILE_SIZE;
        newDir = 'up';
        moving = true;
      } else if (keys.has('s') || keys.has('arrowdown')) {
        nextGridY += TILE_SIZE;
        newDir = 'down';
        moving = true;
      } else if (keys.has('a') || keys.has('arrowleft')) {
        nextGridX -= TILE_SIZE;
        newDir = 'left';
        moving = true;
      } else if (keys.has('d') || keys.has('arrowright')) {
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
  }, []);

  const update = useCallback((dt: number) => {
    const currentState = stateRef.current;
    updateNPCs(dt, currentState.isTalking);
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
