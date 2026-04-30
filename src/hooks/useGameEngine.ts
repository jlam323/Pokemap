import { useRef, useState, useEffect, useCallback } from 'react';
import { Entity, GameState, Position, Direction } from '../types';
import { TILE_SIZE, MAP_WIDTH, MAP_HEIGHT, MOVE_DURATION } from '../constants';
import mapTileGrid from '../data/map_tile_grid.json';

const INITIAL_PLAYER: Entity = {
  id: 'player',
  type: 'player',
  pos: { x: TILE_SIZE * 24, y: TILE_SIZE * 31 },
  dir: 'down',
  spriteIndex: 0,
  isMoving: false,
  walkFrame: 0,
};

const INITIAL_NPCS: Entity[] = [
  {
    id: 'npc1',
    type: 'npc',
    pos: { x: TILE_SIZE * 28, y: TILE_SIZE * 20 },
    dir: 'left',
    spriteIndex: 1,
    spriteName: 'oak',
    name: 'Professor Oak',
    movementType: 'random',
    movementTimer: Math.random() * 5000, // Stagger movements
    dialogue: [
      "This world is inhabited by creatures called Pokémon",
      "Hey! Wait! Don't go out! It's unsafe! Wild Pokémon live in tall grass!",
      "...Erm, what was my grandson's name now?"
    ]
  },
  {
    id: 'npc2',
    type: 'npc',
    pos: { x: TILE_SIZE * 22, y: TILE_SIZE * 25 },
    dir: 'right',
    spriteIndex: 2,
    name: 'Nurse Joy',
    movementType: 'stationary',
    dialogue: [
      "You look a bit lost.",
      "Are you enjoying the view?",
      "Be sure to stay on the paths!"
    ]
  }
];

export function useGameEngine() {
  const [gameState, setGameState] = useState<GameState>({
    player: INITIAL_PLAYER,
    npcs: INITIAL_NPCS,
    isTalking: false,
    activeDialogue: null,
    dialogueIndex: 0,
  });

  const playerRef = useRef<Entity>(INITIAL_PLAYER);
  const npcsRef = useRef<Entity[]>(INITIAL_NPCS);
  const stateRef = useRef<GameState>(gameState);
  const keysPressed = useRef<Set<string>>(new Set());
  const moveTimerRef = useRef<number>(0);
  const bobTimerRef = useRef<number>(0);
  const lastStepDirRef = useRef<Direction | null>(null);
  const footCycleRef = useRef<number>(1);
  const startPosRef = useRef<Position>(INITIAL_PLAYER.pos);
  const targetPosRef = useRef<Position>(INITIAL_PLAYER.pos);

  useEffect(() => {
    stateRef.current = gameState;
  }, [gameState]);

  const nextDialogue = useCallback(() => {
    setGameState(prev => {
      if (!prev.activeDialogue) return prev;
      if (prev.dialogueIndex < prev.activeDialogue.length - 1) {
        return { ...prev, dialogueIndex: prev.dialogueIndex + 1 };
      } else {
        return { ...prev, isTalking: false, activeDialogue: null, dialogueIndex: 0 };
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
    const nearbyNPCIndex = npcsRef.current.findIndex(npc => {
      const dx = Math.abs(npc.pos.x - player.pos.x);
      const dy = Math.abs(npc.pos.y - player.pos.y);
      return dx <= TILE_SIZE * 1.5 && dy <= TILE_SIZE * 1.5;
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

      setGameState(prev => {
        const newNpcs = [...prev.npcs];
        newNpcs[nearbyNPCIndex] = { ...newNpcs[nearbyNPCIndex], dir: newDir };
        return {
          ...prev,
          npcs: newNpcs,
          isTalking: true,
          activeDialogue: nearbyNPC.dialogue!,
          dialogueIndex: 0
        };
      });
    }
  }, [nextDialogue]);

  const update = useCallback((dt: number) => {
    const currentState = stateRef.current;
    
    // NPC updates - mutation of ref for performance
    npcsRef.current.forEach(npc => {
      // Don't move if talking
      if (currentState.isTalking) return;

      if (npc.isMoving) {
        npc.moveProgress = (npc.moveProgress || 0) + dt / MOVE_DURATION;
        if (npc.moveProgress >= 1) {
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
            // Check collision with player
            const player = playerRef.current;
            const playerAtTarget = player.pos.x === nextX && player.pos.y === nextY;
            const playerMovingToTarget = player.isMoving && Math.floor(player.pos.x/TILE_SIZE) === gridX && Math.floor(player.pos.y/TILE_SIZE) === gridY;

            // Check collision with other NPCs
            const npcAtTarget = npcsRef.current.some(other => other.id !== npc.id && other.pos.x === nextX && other.pos.y === nextY);

            if (!playerAtTarget && !playerMovingToTarget && !npcAtTarget) {
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

    const player = playerRef.current;
    if (currentState.isTalking) return;

    if (player.isMoving) {
      moveTimerRef.current += dt;
      const progress = Math.min(moveTimerRef.current / MOVE_DURATION, 1);

      player.pos.x = startPosRef.current.x + (targetPosRef.current.x - startPosRef.current.x) * progress;
      player.pos.y = startPosRef.current.y + (targetPosRef.current.y - startPosRef.current.y) * progress;

      if (progress >= 1) {
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

        const collidingNPC = currentState.npcs.some(npc => 
          npc.pos.x === nextGridX && npc.pos.y === nextGridY
        );

        if (canMove && !collidingNPC) {
          // Reset bob timer when starting a move
          bobTimerRef.current = 0;
          
          // Toggle foot cycle for every step taken
          footCycleRef.current = footCycleRef.current === 1 ? 2 : 1;
          player.walkFrame = footCycleRef.current;
          lastStepDirRef.current = newDir;

          player.isMoving = true;
          player.isSurfing = enteringWater;
          moveTimerRef.current = 0;
          startPosRef.current = { ...player.pos };
          targetPosRef.current = { x: nextGridX, y: nextGridY };
        }
      }
    }
  }, []);

  return {
    gameState,
    setGameState,
    playerRef,
    npcsRef,
    stateRef,
    keysPressed,
    update,
    handleInteraction
  };
}
