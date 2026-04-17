import { useRef, useState, useEffect, useCallback } from 'react';
import { Entity, GameState, Position } from '../types';
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
    name: 'Professor Birch',
    dialogue: [
      "Welcome to this new region!",
      "I'm studying the local pixel-art geography.",
      "The map here is quite extensive!"
    ]
  },
  {
    id: 'npc2',
    type: 'npc',
    pos: { x: TILE_SIZE * 22, y: TILE_SIZE * 25 },
    dir: 'right',
    spriteIndex: 2,
    name: 'Nurse Joy',
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
  const stateRef = useRef<GameState>(gameState);
  const keysPressed = useRef<Set<string>>(new Set());
  const moveTimerRef = useRef<number>(0);
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
    const nearbyNPC = currentState.npcs.find(npc => {
      const dx = Math.abs(npc.pos.x - player.pos.x);
      const dy = Math.abs(npc.pos.y - player.pos.y);
      return dx <= TILE_SIZE * 1.5 && dy <= TILE_SIZE * 1.5;
    });

    if (nearbyNPC && nearbyNPC.dialogue) {
      setGameState(prev => ({
        ...prev,
        isTalking: true,
        activeDialogue: nearbyNPC.dialogue!,
        dialogueIndex: 0
      }));
    }
  }, [nextDialogue]);

  const update = useCallback((dt: number) => {
    const currentState = stateRef.current;
    if (currentState.isTalking) return;

    const player = playerRef.current;

    if (player.isMoving) {
      moveTimerRef.current += dt;
      const progress = Math.min(moveTimerRef.current / MOVE_DURATION, 1);

      player.pos.x = startPosRef.current.x + (targetPosRef.current.x - startPosRef.current.x) * progress;
      player.pos.y = startPosRef.current.y + (targetPosRef.current.y - startPosRef.current.y) * progress;
      
      player.walkFrame = Math.floor(progress * 4) % 4;

      if (progress >= 1) {
        player.isMoving = false;
        player.pos = { ...targetPosRef.current };
        player.walkFrame = 0;
      }
    } else {
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
    stateRef,
    keysPressed,
    update,
    handleInteraction
  };
}
