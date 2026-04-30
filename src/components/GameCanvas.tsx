import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { GameEngine } from './GameEngine';
import { DialogueBox } from './ui/DialogueBox';
import { GBCOverlay } from './overlays/GBCOverlay';
import { GBAOverlay } from './overlays/GBAOverlay';
import { TILE_SIZE, MAP_WIDTH, MAP_HEIGHT } from '../constants';
import { NPC_SPRITE_CONFIGS } from '../data/npcs';
import { PLAYER_SPRITE_CONFIG } from '../data/player';
import { useAssets } from '../hooks/useAssets';
import { drawPixelSprite } from './SpriteRenderer';

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [overlayMode, setOverlayMode] = useState<'none' | 'gbc' | 'gba'>('gbc');
  const [displayedOverlayMode, setDisplayedOverlayMode] = useState(overlayMode);
  const displayedOverlayRef = useRef(displayedOverlayMode);
  const dimensionsRef = useRef(dimensions);
  const lastTimeRef = useRef<number>(0);

  const { isLoaded, playerImages, npcImages, mapImage } = useAssets();

  const {
    gameState,
    playerRef,
    npcsRef,
    stateRef,
    keysPressed,
    update,
    handleInteraction
  } = GameEngine();

  useEffect(() => {
    displayedOverlayRef.current = displayedOverlayMode;
  }, [displayedOverlayMode]);

  useEffect(() => {
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
      if (observer) observer.disconnect();
      cancelAnimationFrame(frameId);
    };
  }, [overlayMode]);

  const draw = (ctx: CanvasRenderingContext2D) => {
    const { width, height } = dimensionsRef.current;
    if (width === 0 || height === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const totalMapWidth = MAP_WIDTH * TILE_SIZE;
    const totalMapHeight = MAP_HEIGHT * TILE_SIZE;
    const currentOverlay = displayedOverlayRef.current;
    const isNone = currentOverlay === 'none';

    const isGBC = currentOverlay === 'gbc';
    const isGBA = currentOverlay === 'gba';
    const minVisibleTiles = isNone ? 50 : (isGBC ? 16 : 22); 
    const maxVisibleTiles = isNone ? 80 : (isGBC ? 16 : 38); 
    const baseVisibleTiles = width / TILE_SIZE;

    let targetScale = 1;
    if (baseVisibleTiles < minVisibleTiles) {
      targetScale = width / (minVisibleTiles * TILE_SIZE);
    } else if (baseVisibleTiles > maxVisibleTiles) {
      targetScale = width / (maxVisibleTiles * TILE_SIZE);
    }

    // Quantize scale to nearest 0.25 to avoid messy sub-pixel boundaries
    // We also round the dimensions to ensure logicalWidth/Height calculation is stable
    const canvasWidth = Math.round(width);
    const canvasHeight = Math.round(height);
    const scale = isNone ? targetScale : Math.round(targetScale * 4) / 4;

    const logicalWidth = canvasWidth / scale;
    const logicalHeight = canvasHeight / scale;
    const currentState = stateRef.current;
    
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, width * dpr, height * dpr);
    ctx.scale(dpr, dpr);

    const player = playerRef.current;
    // We calculate the raw camera position
    let targetCameraX = player.pos.x + TILE_SIZE / 2 - logicalWidth / 2;
    let targetCameraY = player.pos.y + TILE_SIZE / 2 - logicalHeight / 2;

    targetCameraX = Math.max(0, Math.min(targetCameraX, Math.max(0, totalMapWidth - logicalWidth)));
    targetCameraY = Math.max(0, Math.min(targetCameraY, Math.max(0, totalMapHeight - logicalHeight)));

    const offsetX = logicalWidth > totalMapWidth ? (logicalWidth - totalMapWidth) / 2 : 0;
    const offsetY = logicalHeight > totalMapHeight ? (logicalHeight - totalMapHeight) / 2 : 0;

    ctx.save();
    
    // Snap camera to the nearest logical pixel that corresponds to a physical pixel
    // This prevents "shimmering" or "seams" between tiles
    const cameraX = Math.round((targetCameraX - offsetX) * scale) / scale;
    const cameraY = Math.round((targetCameraY - offsetY) * scale) / scale;

    const physicalX = Math.round((offsetX - cameraX) * scale);
    const physicalY = Math.round((offsetY - cameraY) * scale);
    
    ctx.translate(physicalX, physicalY);
    ctx.scale(scale, scale);

    if (mapImage) {
        ctx.drawImage(mapImage, 0, 0, totalMapWidth, totalMapHeight);
    } else {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, totalMapWidth, totalMapHeight);
    }

    npcsRef.current.forEach(npc => {
      const images = npc.spriteName ? npcImages[npc.spriteName] : undefined;
      drawPixelSprite(
        ctx, 
        npc.pos.x, 
        npc.pos.y, 
        npc.dir, 
        npc.walkFrame || 0, 
        npc.isSurfing || false, 
        images,
        npc.spriteName
      );
    });

    drawPixelSprite(ctx, player.pos.x, player.pos.y, player.dir, player.walkFrame, player.isSurfing, playerImages);
    
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
  }, [update, isLoaded]); // Re-start loop when loaded

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

  if (!isLoaded) return (
    <div className="fixed inset-0 bg-black flex items-center justify-center text-white text-[10px] tracking-[4px]">
      LOADING ASSETS...
    </div>
  );

  return (
    <div className="relative h-screen w-screen bg-[#1a1a1a] overflow-hidden font-mono uppercase">
      {/* Home Button - Always Visible */}
      <a 
        href="https://jonalam.com" 
        className="fixed top-8 left-8 z-[110] flex items-center gap-3 px-6 py-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-all group shadow-2xl pointer-events-auto"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span className="text-[10px] font-black tracking-[3px] uppercase">jonalam.com</span>
      </a>

      {/* Mode Toggle Overlay - Always Visible */}
      <div className="fixed top-8 left-1/2 -translate-x-1/2 flex gap-1 z-[100] pointer-events-auto bg-black/40 backdrop-blur-xl border border-white/10 p-1.5 rounded-full shadow-2xl">
        {(['none', 'gbc', 'gba'] as const).map(mode => (
          <button
            key={mode}
            onClick={() => {
              if (mode === overlayMode) return;
              // If we are coming from 'none', we might want a slightly faster sync?
              // Actually keeping it consistent is cleaner.
              setOverlayMode(mode);
            }}
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

      <AnimatePresence mode="wait" onExitComplete={() => setDisplayedOverlayMode(overlayMode)}>
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
            <AnimatePresence mode="wait" onExitComplete={() => setDisplayedOverlayMode(overlayMode)}>
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
