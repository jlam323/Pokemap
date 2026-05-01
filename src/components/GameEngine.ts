import { useRef, useState, useEffect, useCallback } from 'react';
import { Entity, GameState, Position, Direction } from '../types';
import { TILE_SIZE, MAP_WIDTH, MAP_HEIGHT, MOVE_DURATION, BUMP_DURATION, BUMP_DISTANCE } from '../constants';
import { INITIAL_NPCS } from '../data/npcs';
import { INITIAL_PLAYER } from '../data/player';
import mapTileGrid from '../data/map_tile_grid.json';

export function GameEngine() {
  const [gameState, setGameState] = useState<GameState>({
    player: INITIAL_PLAYER,
    npcs: INITIAL_NPCS,
    isTalking: false,
    talkingNPCId: null,
    activeDialogue: null,
    dialogueIndex: 0,
  });

  const playerRef = useRef<Entity>(INITIAL_PLAYER);
  const npcsRef = useRef<Entity[]>(INITIAL_NPCS);
  const stateRef = useRef<GameState>(gameState);
  const collisionMapRef = useRef<Set<string>>(new Set());

  // Initialize collision map with starting positions
  useEffect(() => {
    const map = new Set<string>();
    map.add(`${INITIAL_PLAYER.pos.x},${INITIAL_PLAYER.pos.y}`);
    INITIAL_NPCS.forEach(npc => {
      map.add(`${npc.pos.x},${npc.pos.y}`);
    });
    collisionMapRef.current = map;
  }, []);
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

    const nearbyNPCIndex = npcsRef.current.findIndex(npc => {
      // Use round to avoid tiny floating point differences
      const nx = Math.round(npc.pos.x);
      const ny = Math.round(npc.pos.y);
      const tx = Math.round(targetX);
      const ty = Math.round(targetY);
      return nx === tx && ny === ty;
    });

    if (nearbyNPCIndex !== -1) {
      const nearbyNPC = npcsRef.current[nearbyNPCIndex];
      
      // Make NPC look at player
      const dx = player.pos.x - nearbyNPC.pos.x;
      const dy = player.pos.y - nearbyNPC.pos.y;
      
      let newDir: Direction = nearbyNPC.dir;
      if (Math.abs(dx) > Math.abs(dy)) {
        newDir = dx > 0 ? 'right' : 'left';
      } else {
        newDir = dy > 0 ? 'down' : 'up';
      }

      // Update ref immediately for the renderer
      npcsRef.current[nearbyNPCIndex].dir = newDir;

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
          const inBounds = gridX >= 0 && gridX < MAP_WIDTH && gridY >= 0 && gridY < MAP_HEIGHT;

          if (inBounds && mapTileGrid[gridY][gridX] === 0) {
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
        
        const inBounds = gridX >= 0 && gridX < MAP_WIDTH &&
                         gridY >= 0 && gridY < MAP_HEIGHT;

        let canMove = inBounds;
        let enteringWater = false;

        if (inBounds) {
          const tileGrid: number[][] = mapTileGrid;
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
    handleArrowUp
  };
}
