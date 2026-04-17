import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, ArrowBigUp, ArrowBigDown, ArrowBigLeft, ArrowBigRight } from 'lucide-react';
import { Position, Entity, Direction, GameState } from '../types';
import mapTileGrid from '../data/map_tile_grid.json';

const TILE_SIZE = 32;
const MAP_WIDTH = 100;
const MAP_HEIGHT = 60;

const MOVE_DURATION = 200; // Slightly faster grid movement

const INITIAL_PLAYER: Entity = {
  id: 'player',
  type: 'player',
  pos: { x: TILE_SIZE * 50, y: TILE_SIZE * 30 }, // Start in middle of 100x60 map
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

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapImageRef = useRef<HTMLImageElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [gameState, setGameState] = useState<GameState>({
    player: INITIAL_PLAYER,
    npcs: INITIAL_NPCS,
    isTalking: false,
    activeDialogue: null,
    dialogueIndex: 0,
  });

  const playerRef = useRef<Entity>(INITIAL_PLAYER);
  const stateRef = useRef<GameState>({
    player: INITIAL_PLAYER,
    npcs: INITIAL_NPCS,
    isTalking: false,
    activeDialogue: null,
    dialogueIndex: 0,
  });
  const dimensionsRef = useRef({ width: 0, height: 0 });
  const keysPressed = useRef<Set<string>>(new Set());
  const lastTimeRef = useRef<number>(0);
  const moveTimerRef = useRef<number>(0);
  const startPosRef = useRef<Position>(INITIAL_PLAYER.pos);
  const targetPosRef = useRef<Position>(INITIAL_PLAYER.pos);

  useEffect(() => {
    // Sync ref with state for the game loop
    stateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    // Load map image
    const img = new Image();
    img.src = '/cerulean-city.png';
    img.onload = () => {
      console.log('Map image loaded successfully');
      mapImageRef.current = img;
    };
    img.onerror = () => {
      console.warn('Map image failed to load, using fallback environment');
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key.toLowerCase());
      if (e.key === ' ' || e.key === 'Enter') {
        handleInteraction();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Initial size
    if (containerRef.current) {
        const d = {
            width: containerRef.current.clientWidth,
            height: containerRef.current.clientHeight
        };
        setDimensions(d);
        dimensionsRef.current = d;
    }

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const d = {
          width: entry.contentRect.width,
          height: entry.contentRect.height
        };
        setDimensions(d);
        dimensionsRef.current = d;
      }
    });

    if (containerRef.current) observer.observe(containerRef.current);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      observer.disconnect();
    };
  }, [gameState.isTalking]);

  const handleInteraction = () => {
    if (gameState.isTalking) {
      nextDialogue();
      return;
    }

    // Check for nearby NPCs
    const player = playerRef.current;
    const nearbyNPC = gameState.npcs.find(npc => {
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
  };

  const nextDialogue = () => {
    setGameState(prev => {
      if (!prev.activeDialogue) return prev;
      if (prev.dialogueIndex < prev.activeDialogue.length - 1) {
        return { ...prev, dialogueIndex: prev.dialogueIndex + 1 };
      } else {
        return { ...prev, isTalking: false, activeDialogue: null, dialogueIndex: 0 };
      }
    });
  };

  const update = (dt: number) => {
    const currentState = stateRef.current;
    if (currentState.isTalking) return;

    const player = playerRef.current;

    if (player.isMoving) {
      moveTimerRef.current += dt;
      const progress = Math.min(moveTimerRef.current / MOVE_DURATION, 1);
      
      // Interpolate visual position
      player.pos.x = startPosRef.current.x + (targetPosRef.current.x - startPosRef.current.x) * progress;
      player.pos.y = startPosRef.current.y + (targetPosRef.current.y - startPosRef.current.y) * progress;
      
      // Animation frame (0, 1, 2, 1) or just toggle
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

      if (keysPressed.current.has('w') || keysPressed.current.has('arrowup')) {
        nextGridY -= TILE_SIZE;
        newDir = 'up';
        moving = true;
      } else if (keysPressed.current.has('s') || keysPressed.current.has('arrowdown')) {
        nextGridY += TILE_SIZE;
        newDir = 'down';
        moving = true;
      } else if (keysPressed.current.has('a') || keysPressed.current.has('arrowleft')) {
        nextGridX -= TILE_SIZE;
        newDir = 'left';
        moving = true;
      } else if (keysPressed.current.has('d') || keysPressed.current.has('arrowright')) {
        nextGridX += TILE_SIZE;
        newDir = 'right';
        moving = true;
      }

      if (moving) {
        player.dir = newDir;
        
        // Boundary Check (Extended for full map)
        const gridX = Math.floor(nextGridX / TILE_SIZE);
        const gridY = Math.floor(nextGridY / TILE_SIZE);
        
        const inBounds = gridX >= 0 && gridX < MAP_WIDTH &&
                         gridY >= 0 && gridY < MAP_HEIGHT;

        let canMove = inBounds;
        let enteringWater = false;

        if (inBounds) {
          const tileType = mapTileGrid[gridY][gridX];
          if (tileType === 1) {
            canMove = false; // Blocked
          } else if (tileType === 2) {
            enteringWater = true;
          }
        }

        // Collision Check (NPCs)
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
  };

  const drawPixelSprite = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, dir: Direction, walkFrame: number = 0, isSurfing: boolean = false) => {
    // Body bobbing
    const bob = walkFrame % 2 === 1 ? -2 : 0;

    if (isSurfing) {
        // Draw Boat instead of Person
        ctx.fillStyle = '#8b4513'; // Saddle brown
        ctx.beginPath();
        ctx.moveTo(x + 2, y + 20);
        ctx.lineTo(x + 30, y + 20);
        ctx.lineTo(x + 24, y + 30);
        ctx.lineTo(x + 8, y + 30);
        ctx.fill();
        
        // Mast
        ctx.fillStyle = '#5c4033';
        ctx.fillRect(x + 15, y + 4, 2, 16);
        
        // Sail
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.moveTo(x + 17, y + 4);
        ctx.lineTo(x + 25, y + 12);
        ctx.lineTo(x + 17, y + 18);
        ctx.fill();
        
        // Tiny head of player in boat
        ctx.fillStyle = color;
        ctx.fillRect(x + 12, y + 14, 8, 8);
        return;
    }

    // Sprite Border for better visibility on green
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(x + 2, y + 2 + bob, 28, 28);

    // Body
    ctx.fillStyle = color;
    ctx.fillRect(x + 4, y + 4 + bob, 24, 24);
    
    // Head/Hair
    ctx.fillStyle = '#333';
    ctx.fillRect(x + 4, y + bob, 24, 8);
    
    // Eyes
    ctx.fillStyle = 'white';
    if (dir === 'down') {
        ctx.fillRect(x + 8, y + 10 + bob, 4, 4);
        ctx.fillRect(x + 20, y + 10 + bob, 4, 4);
    } else if (dir === 'up') {
        // No eyes for back view usually
    } else if (dir === 'left') {
        ctx.fillRect(x + 4, y + 10 + bob, 4, 4);
    } else if (dir === 'right') {
        ctx.fillRect(x + 24, y + 10 + bob, 4, 4);
    }
    
    // Feet - Animation Logic
    ctx.fillStyle = '#111';
    if (walkFrame === 1) {
        // Left foot up
        ctx.fillRect(x + 6, y + 26 + bob, 8, 4); 
        ctx.fillRect(x + 18, y + 29 + bob, 8, 4);
    } else if (walkFrame === 3) {
        // Right foot up
        ctx.fillRect(x + 6, y + 29 + bob, 8, 4);
        ctx.fillRect(x + 18, y + 26 + bob, 8, 4);
    } else {
        // Both feet down
        ctx.fillRect(x + 6, y + 29 + bob, 8, 4);
        ctx.fillRect(x + 18, y + 29 + bob, 8, 4);
    }
  };

  const drawTree = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    // Trunk
    ctx.fillStyle = '#5c4033';
    ctx.fillRect(x + 12, y + 16, 8, 16);
    // Leaves
    ctx.fillStyle = '#2d5a27';
    ctx.fillRect(x, y, 32, 18);
    ctx.fillStyle = '#3a7233';
    ctx.fillRect(x + 4, y + 4, 24, 10);
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    const { width, height } = dimensionsRef.current;
    if (width === 0 || height === 0) return;

    const dpr = window.devicePixelRatio || 1;

    const totalMapWidth = MAP_WIDTH * TILE_SIZE;
    const totalMapHeight = MAP_HEIGHT * TILE_SIZE;

    // 1. Calculate dynamic zoom scale
    // Increase visibility to see "a bit more" of the map
    const minVisibleTiles = MAP_WIDTH * 0.45; // Previously 0.3
    const maxVisibleTiles = MAP_WIDTH * 0.65; // Previously 0.5
    const baseVisibleTiles = width / TILE_SIZE;

    let scale = 1;
    if (baseVisibleTiles < minVisibleTiles) {
      scale = width / (minVisibleTiles * TILE_SIZE);
    } else if (baseVisibleTiles > maxVisibleTiles) {
      scale = width / (maxVisibleTiles * TILE_SIZE);
    }

    // 2. Adjust logical viewport dimensions for camera
    const logicalWidth = width / scale;
    const logicalHeight = height / scale;

    const currentState = stateRef.current;
    
    // Clear whole canvas (physical coords)
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, width * dpr, height * dpr);
    
    // Apply DPR scale first
    ctx.scale(dpr, dpr);

    const player = playerRef.current;
    
    // Calculate Camera (centered on player in logical coords)
    let cameraX = player.pos.x + TILE_SIZE / 2 - logicalWidth / 2;
    let cameraY = player.pos.y + TILE_SIZE / 2 - logicalHeight / 2;

    // Clamp camera to map bounds
    cameraX = Math.max(0, Math.min(cameraX, Math.max(0, totalMapWidth - logicalWidth)));
    cameraY = Math.max(0, Math.min(cameraY, Math.max(0, totalMapHeight - logicalHeight)));

    // Center map in logical space
    const offsetX = logicalWidth > totalMapWidth ? (logicalWidth - totalMapWidth) / 2 : 0;
    const offsetY = logicalHeight > totalMapHeight ? (logicalHeight - totalMapHeight) / 2 : 0;

    ctx.save();
    ctx.scale(scale, scale);
    ctx.translate(offsetX - cameraX, offsetY - cameraY);

    // Draw Map background image if loaded
    if (mapImageRef.current) {
        ctx.drawImage(mapImageRef.current, 0, 0, totalMapWidth, totalMapHeight);
    } else {
        // Fallback: Draw Grass with pattern
        ctx.fillStyle = '#7ac74c';
        ctx.fillRect(0, 0, totalMapWidth, totalMapHeight);
        
        // Simple procedural grass details
        ctx.fillStyle = '#6ab73c';
        for(let i=0; i<MAP_WIDTH; i+=2) {
            for(let j=0; j<MAP_HEIGHT; j+=2) {
                if((i+j)%3 === 0) ctx.fillRect(i*TILE_SIZE + 10, j*TILE_SIZE + 10, 2, 2);
            }
        }

        // Draw basic paths in fallback
        ctx.fillStyle = '#e0d1a4';
        ctx.fillRect(TILE_SIZE * 24, 0, TILE_SIZE * 3, MAP_HEIGHT * TILE_SIZE); // Central vertical path
        ctx.fillRect(0, TILE_SIZE * 20, MAP_WIDTH * TILE_SIZE, TILE_SIZE * 3); // Central horizontal path

        // Add some trees
        for(let i=0; i<MAP_WIDTH; i+=4) {
            drawTree(ctx, i * TILE_SIZE, 0);
            drawTree(ctx, i * TILE_SIZE, (MAP_HEIGHT - 1) * TILE_SIZE);
        }
        for(let j=0; j<MAP_HEIGHT; j+=4) {
            drawTree(ctx, 0, j * TILE_SIZE);
            drawTree(ctx, (MAP_WIDTH - 1) * TILE_SIZE, j * TILE_SIZE);
        }
    }

    // Draw NPCs
    currentState.npcs.forEach(npc => {
      drawPixelSprite(ctx, npc.pos.x, npc.pos.y, npc.spriteIndex === 1 ? '#339af0' : '#f06595', npc.dir, npc.walkFrame, npc.isSurfing);
    });

    // Draw Player
    drawPixelSprite(ctx, player.pos.x, player.pos.y, '#fab005', player.dir, player.walkFrame, player.isSurfing);
    
    // Draw interaction indicator
    const nearbyNPC = currentState.npcs.find(npc => {
        const dx = Math.abs(npc.pos.x - player.pos.x);
        const dy = Math.abs(npc.pos.y - player.pos.y);
        return dx <= TILE_SIZE * 1.5 && dy <= TILE_SIZE * 1.5;
    });

    if (nearbyNPC && !currentState.isTalking) {
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 4;
        ctx.font = 'bold 14px font-mono';
        const text = 'PRESS SPACE TO TALK';
        const textWidth = ctx.measureText(text).width;
        const textX = player.pos.x + 16 - textWidth/2;
        const textY = player.pos.y - 15;
        ctx.strokeText(text, textX, textY);
        ctx.fillText(text, textX, textY);
    }

    ctx.restore();
  };

  const loop = (time: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = time;
    const dt = time - lastTimeRef.current;
    lastTimeRef.current = time;

    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      // Ensure pixel art is sharp (disable smoothing)
      ctx.imageSmoothingEnabled = false;
      
      update(dt);
      draw(ctx);
    }

    requestAnimationFrame(loop);
  };

  useEffect(() => {
    requestAnimationFrame(loop);
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center h-screen w-screen bg-[#2c2c2c] overflow-hidden font-mono">
      {/* HUD overlays */}
      <div className="absolute top-8 text-white text-center z-10 pointer-events-none drop-shadow-lg">
        <h1 className="text-3xl font-bold tracking-tighter uppercase mb-2">Pixel Quest</h1>
        <p className="text-xs opacity-60">WASD to Move • SPACE to Talk</p>
      </div>

      <div ref={containerRef} className="absolute inset-0 w-full h-full bg-[#1a1a1a]">
        <canvas
          ref={canvasRef}
          width={dimensions.width * (window.devicePixelRatio || 1)}
          height={dimensions.height * (window.devicePixelRatio || 1)}
          className="bg-[#1a1a1a] image-rendering-pixelated cursor-none block w-full h-full"
          style={{ imageRendering: 'pixelated' }}
        />

        <AnimatePresence>
          {gameState.isTalking && gameState.activeDialogue && (
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="absolute bottom-4 left-4 right-4 bg-white border-4 border-black p-4 flex gap-4 min-h-[100px]"
            >
              <div className="w-16 h-16 bg-blue-100 border-2 border-black flex-shrink-0 flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold uppercase mb-1 text-gray-500">
                    {gameState.npcs.find(n => n.dialogue === gameState.activeDialogue)?.name || 'NPC'}
                </p>
                <p className="text-lg leading-tight uppercase">
                    {gameState.activeDialogue[gameState.dialogueIndex]}
                </p>
                <div className="absolute bottom-2 right-4 text-[10px] animate-pulse">
                    Press SPACE to continue...
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="absolute bottom-8 flex gap-4 opacity-40 hover:opacity-100 transition-opacity z-10 pointer-events-none drop-shadow-lg">
        <div className="flex flex-col items-center gap-1">
            <kbd className="px-2 py-1 bg-white border-2 border-black text-black text-xs font-bold">W</kbd>
            <div className="flex gap-1">
                <kbd className="px-2 py-1 bg-white border-2 border-black text-black text-xs font-bold">A</kbd>
                <kbd className="px-2 py-1 bg-white border-2 border-black text-black text-xs font-bold">S</kbd>
                <kbd className="px-2 py-1 bg-white border-2 border-black text-black text-xs font-bold">D</kbd>
            </div>
        </div>
        <div className="h-10 w-[1px] bg-white opacity-20" />
        <div className="flex items-center">
            <kbd className="px-4 py-2 bg-white border-2 border-black text-black text-xs font-bold">SPACE</kbd>
        </div>
      </div>
    </div>
  );
}
