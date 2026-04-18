import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useGameEngine } from '../hooks/useGameEngine';
import { DialogueBox } from './ui/DialogueBox';
import { GBCOverlay } from './overlays/GBCOverlay';
import { GBAOverlay } from './overlays/GBAOverlay';
import { TILE_SIZE, MAP_WIDTH, MAP_HEIGHT } from '../constants';
import { drawPixelSprite, drawTree } from '../lib/renderer';

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapImageRef = useRef<HTMLImageElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [overlayMode, setOverlayMode] = useState<'none' | 'gbc' | 'gba'>('gbc');
  const overlayModeRef = useRef(overlayMode);
  const dimensionsRef = useRef(dimensions);
  const lastTimeRef = useRef<number>(0);

  const {
    gameState,
    playerRef,
    stateRef,
    keysPressed,
    update,
    handleInteraction
  } = useGameEngine();

  useEffect(() => {
    overlayModeRef.current = overlayMode;
  }, [overlayMode]);

  useEffect(() => {
    // Load map image
    const img = new Image();
    // Resolve path dynamically based on Vite's base
    const base = import.meta.env.BASE_URL.replace(/\/$/, '') || '.';
    img.src = `${base}/cerulean-city-map.png`;
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

    let observedElement: HTMLElement | null = null;
    let observer: ResizeObserver | null = null;
    let frameId: number;

    const measure = () => {
      const el = containerRef.current;
      if (el) {
        const d = {
          width: el.clientWidth,
          height: el.clientHeight
        };
        if (d.width > 0 && d.height > 0) {
          setDimensions(d);
          dimensionsRef.current = d;
          
          if (observedElement !== el) {
            if (observer) observer.disconnect();
            observer = new ResizeObserver((entries) => {
              for (const entry of entries) {
                const newD = {
                  width: entry.contentRect.width,
                  height: entry.contentRect.height
                };
                setDimensions(newD);
                dimensionsRef.current = newD;
              }
            });
            observer.observe(el);
            observedElement = el;
          }
          return true;
        }
      }
      return false;
    };

    const startTime = Date.now();
    const checkMeasure = () => {
      measure();
      // Keep checking for at least 2 seconds to handle transition delays perfectly
      if (Date.now() - startTime < 2000) {
        frameId = requestAnimationFrame(checkMeasure);
      }
    };
    checkMeasure();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (observer) observer.disconnect();
      cancelAnimationFrame(frameId);
    };
  }, [handleInteraction, keysPressed, overlayMode]);

  const draw = (ctx: CanvasRenderingContext2D) => {
    const { width, height } = dimensionsRef.current;
    if (width === 0 || height === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const totalMapWidth = MAP_WIDTH * TILE_SIZE;
    const totalMapHeight = MAP_HEIGHT * TILE_SIZE;
    const currentOverlay = overlayModeRef.current;
    const isNone = currentOverlay === 'none';

    const minVisibleTiles = isNone ? 50 : 22; 
    const maxVisibleTiles = isNone ? 80 : 38; 
    const baseVisibleTiles = width / TILE_SIZE;

    let scale = 1;
    if (baseVisibleTiles < minVisibleTiles) {
      scale = width / (minVisibleTiles * TILE_SIZE);
    } else if (baseVisibleTiles > maxVisibleTiles) {
      scale = width / (maxVisibleTiles * TILE_SIZE);
    }

    const logicalWidth = width / scale;
    const logicalHeight = height / scale;
    const currentState = stateRef.current;
    
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, width * dpr, height * dpr);
    ctx.scale(dpr, dpr);

    const player = playerRef.current;
    let cameraX = player.pos.x + TILE_SIZE / 2 - logicalWidth / 2;
    let cameraY = player.pos.y + TILE_SIZE / 2 - logicalHeight / 2;

    cameraX = Math.max(0, Math.min(cameraX, Math.max(0, totalMapWidth - logicalWidth)));
    cameraY = Math.max(0, Math.min(cameraY, Math.max(0, totalMapHeight - logicalHeight)));

    const offsetX = logicalWidth > totalMapWidth ? (logicalWidth - totalMapWidth) / 2 : 0;
    const offsetY = logicalHeight > totalMapHeight ? (logicalHeight - totalMapHeight) / 2 : 0;

    ctx.save();
    const physicalX = Math.round((offsetX - cameraX) * scale);
    const physicalY = Math.round((offsetY - cameraY) * scale);
    
    ctx.translate(physicalX, physicalY);
    ctx.scale(scale, scale);

    if (mapImageRef.current) {
        ctx.drawImage(mapImageRef.current, 0, 0, totalMapWidth, totalMapHeight);
    } else {
        ctx.fillStyle = '#7ac74c';
        ctx.fillRect(0, 0, totalMapWidth, totalMapHeight);
        ctx.fillStyle = '#6ab73c';
        for(let i=0; i<MAP_WIDTH; i+=2) {
            for(let j=0; j<MAP_HEIGHT; j+=2) {
                if((i+j)%3 === 0) ctx.fillRect(i*TILE_SIZE + 10, j*TILE_SIZE + 10, 2, 2);
            }
        }
        ctx.fillStyle = '#e0d1a4';
        ctx.fillRect(TILE_SIZE * 24, 0, TILE_SIZE * 3, MAP_HEIGHT * TILE_SIZE);
        ctx.fillRect(0, TILE_SIZE * 20, MAP_WIDTH * TILE_SIZE, TILE_SIZE * 3);
        for(let i=0; i<MAP_WIDTH; i+=4) {
            drawTree(ctx, i * TILE_SIZE, 0);
            drawTree(ctx, i * TILE_SIZE, (MAP_HEIGHT - 1) * TILE_SIZE);
        }
        for(let j=0; j<MAP_HEIGHT; j+=4) {
            drawTree(ctx, 0, j * TILE_SIZE);
            drawTree(ctx, (MAP_WIDTH - 1) * TILE_SIZE, j * TILE_SIZE);
        }
    }

    currentState.npcs.forEach(npc => {
      drawPixelSprite(ctx, npc.pos.x, npc.pos.y, npc.spriteIndex === 1 ? '#339af0' : '#f06595', npc.dir, npc.walkFrame, npc.isSurfing);
    });

    drawPixelSprite(ctx, player.pos.x, player.pos.y, '#fab005', player.dir, player.walkFrame, player.isSurfing);
    
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
      ctx.imageSmoothingEnabled = false;
      update(dt);
      draw(ctx);
    }

    requestAnimationFrame(loop);
  };

  useEffect(() => {
    const frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [update]);

  const renderCanvas = () => (
    <canvas
      ref={canvasRef}
      tabIndex={0}
      width={dimensions.width * (window.devicePixelRatio || 1)}
      height={dimensions.height * (window.devicePixelRatio || 1)}
      className="image-rendering-pixelated block w-full h-full outline-none"
      style={{ imageRendering: 'pixelated' }}
    />
  );

  return (
    <div className="relative h-screen w-screen bg-[#1a1a1a] overflow-hidden font-mono uppercase">
      {/* Mode Toggle Overlay - Always Visible */}
      <div className="fixed top-8 left-1/2 -translate-x-1/2 flex gap-1 z-[100] pointer-events-auto bg-black/40 backdrop-blur-xl border border-white/10 p-1.5 rounded-full shadow-2xl">
        {(['none', 'gbc', 'gba'] as const).map(mode => (
          <button
            key={mode}
            onClick={() => setOverlayMode(mode)}
            className={`px-6 py-2 text-[9px] font-black tracking-[3px] rounded-full transition-all duration-300 ${
              overlayMode === mode 
                ? 'bg-white text-black shadow-[0_4px_12px_rgba(0,0,0,0.5)] scale-105' 
                : 'text-white/40 hover:text-white/80 hover:bg-white/5'
            }`}
          >
            {mode.toUpperCase()}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {overlayMode === 'none' && (
          <motion.div 
            key="fullscreen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            ref={containerRef} 
            className="fixed inset-0 bg-black z-0"
          >
            {renderCanvas()}
            <AnimatePresence>
              {gameState.isTalking && gameState.activeDialogue && (
                <DialogueBox gameState={gameState} isFullScreen />
              )}
            </AnimatePresence>
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 px-8 py-4 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl opacity-60 hover:opacity-100 transition-all duration-300 z-10 shadow-2xl group">
                <div className="flex flex-col items-center gap-1">
                    <kbd className="px-2 py-1 bg-white border-b-4 border-gray-300 rounded text-black text-[10px] font-black min-w-[30px] flex items-center justify-center">W</kbd>
                    <div className="flex gap-1">
                        <kbd className="px-2 py-1 bg-white border-b-4 border-gray-300 rounded text-black text-[10px] font-black min-w-[30px] flex items-center justify-center">A</kbd>
                        <kbd className="px-2 py-1 bg-white border-b-4 border-gray-300 rounded text-black text-[10px] font-black min-w-[30px] flex items-center justify-center">S</kbd>
                        <kbd className="px-2 py-1 bg-white border-b-4 border-gray-300 rounded text-black text-[10px] font-black min-w-[30px] flex items-center justify-center">D</kbd>
                    </div>
                </div>
                <div className="h-12 w-[1px] bg-white opacity-20" />
                <div className="flex flex-col items-center gap-2">
                    <kbd className="px-6 py-2 bg-white border-b-4 border-gray-300 rounded text-black text-[10px] font-black tracking-widest">SPACE</kbd>
                    <span className="text-[8px] text-white/40 font-bold tracking-[2px]">TALK</span>
                </div>
            </div>
          </motion.div>
        )}

        {overlayMode !== 'none' && (
          <motion.div 
            key="overlay"
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            className="flex flex-col items-center justify-center h-full w-full"
          >
            <AnimatePresence mode="wait">
              {overlayMode === 'gbc' && (
                <motion.div
                  key="gbc"
                  initial={{ opacity: 0, rotateY: -10 }}
                  animate={{ opacity: 1, rotateY: 0 }}
                  exit={{ opacity: 0, rotateY: 10 }}
                  className="transition-all duration-500 flex flex-col items-center"
                >
                  <GBCOverlay 
                     gameState={gameState} 
                     handleInteraction={handleInteraction} 
                     keysPressed={keysPressed}
                  >
                    <div ref={containerRef} className="w-full h-full">
                      {renderCanvas()}
                    </div>
                  </GBCOverlay>
                </motion.div>
              )}

              {overlayMode === 'gba' && (
                <motion.div
                  key="gba"
                  initial={{ opacity: 0, rotateX: 10 }}
                  animate={{ opacity: 1, rotateX: 0 }}
                  exit={{ opacity: 0, rotateX: -10 }}
                  className="transition-all duration-500 flex flex-col items-center"
                >
                  <GBAOverlay 
                     gameState={gameState} 
                     handleInteraction={handleInteraction} 
                     keysPressed={keysPressed}
                  >
                    <div ref={containerRef} className="w-full h-full">
                      {renderCanvas()}
                    </div>
                  </GBAOverlay>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
