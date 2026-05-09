import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { GameEngine } from './GameEngine';
import { NoOverlay } from './overlays/NoOverlay';
import { GBCOverlay } from './overlays/GBCOverlay';
import { GBAOverlay } from './overlays/GBAOverlay';
import { TILE_SIZE, POKEMON_SPRITE_SHEET, SPRITE_SHEET_DEFAULTS } from '../constants';
import { useAssets } from '../hooks/useAssets';
import { ITEM_SPRITE_CONFIGS } from '../data/items';
import { ALL_MAPS, TOGGLEABLE_MAPS } from '../data/maps';
import { drawPixelSprite, drawItemSprite } from './SpriteRenderer';
import { findNearbyNPC, findNearbyItem } from '../lib/gameUtils';
import { EntityType } from '../types';

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [overlayMode, setOverlayMode] = useState<'none' | 'gbc' | 'gba'>('gbc');
  const [displayedOverlayMode, setDisplayedOverlayMode] = useState(overlayMode);
  const displayedOverlayRef = useRef(displayedOverlayMode);
  const dimensionsRef = useRef(dimensions);
  const lastTimeRef = useRef<number>(0);

  const { isLoaded, playerImages, npcImages, itemImages, mapImages } = useAssets();

  const {
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
  } = GameEngine();

  const currentMapRef = useRef(currentMap);
  useEffect(() => {
    currentMapRef.current = currentMap;
  }, [currentMap]);

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
    const currentOverlay = displayedOverlayRef.current;
    const mapConfig = currentMapRef.current;
    const overlayConfig = mapConfig.overlays[currentOverlay];
    
    const totalMapWidth = overlayConfig.width * TILE_SIZE;
    const totalMapHeight = overlayConfig.height * TILE_SIZE;
    const isNone = currentOverlay === 'none';

    const isGBC = currentOverlay === 'gbc';
    const isGBA = currentOverlay === 'gba';
    const isMobile = width < 768;
    const minVisibleTiles = isNone ? (isMobile ? 20 : 50) : (isGBC ? 16 : 22); 
    const maxVisibleTiles = isNone ? (isMobile ? 35 : 80) : (isGBC ? 16 : 38); 
    const baseVisibleTiles = width / TILE_SIZE;

    let targetScale = mapConfig.zoomMultiplier || 1;
    if (baseVisibleTiles < minVisibleTiles) {
      targetScale *= width / (minVisibleTiles * TILE_SIZE);
    } else if (baseVisibleTiles > maxVisibleTiles) {
      targetScale *= width / (maxVisibleTiles * TILE_SIZE);
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

    const maxCamX = Math.max(0, totalMapWidth - logicalWidth);
    const maxCamY = Math.max(0, totalMapHeight - logicalHeight);

    targetCameraX = Math.max(0, Math.min(targetCameraX, maxCamX));
    targetCameraY = Math.max(0, Math.min(targetCameraY, maxCamY));

    const offsetX = logicalWidth > totalMapWidth ? (logicalWidth - totalMapWidth) / 2 : 0;
    const offsetY = logicalHeight > totalMapHeight ? (logicalHeight - totalMapHeight) / 2 : 0;

    ctx.save();
    
    // Snap camera/translation to physical pixels
    const physicalX = Math.round((offsetX - targetCameraX) * scale);
    const physicalY = Math.round((offsetY - targetCameraY) * scale);
    
    ctx.translate(physicalX, physicalY);
    ctx.scale(scale, scale);

    const currentMapImage = mapImages[mapConfig.id];
    if (currentMapImage) {
        ctx.drawImage(currentMapImage, 0, 0, totalMapWidth, totalMapHeight);
    } else {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, totalMapWidth, totalMapHeight);
    }

    const spriteScale = mapConfig.spriteScaleMultiplier || 1;

    npcsRef.current.forEach(npc => {
      drawPixelSprite(
        ctx, 
        npc.pos.x, 
        npc.pos.y, 
        npc.dir, 
        npc.walkFrame || 0, 
        npc.isSurfing || false, 
        npcImages, // Pass full npcImages to allow access to _sheets and npc specific records
        npc.spriteName,
        npc.bumpOffset,
        spriteScale,
        npc.scale,
        npc.isActionActive,
        npc.spriteSheet
      );
    });

    // Draw Items
    itemsRef.current.forEach(item => {
      if (item.isCollected) return;
      
      const images = itemImages[item.spriteName];
      if (!images) return;

      const config = ITEM_SPRITE_CONFIGS[item.spriteName];
      let frame: HTMLImageElement | undefined;
      
      if (item.isActionActive && item.actionFrame && config?.actionSequence) {
        // Clamp the frame to the sequence length to be absolutely sure
        const frameIndex = Math.min(item.actionFrame - 1, config.actionSequence.length - 1);
        const frameName = config.actionSequence[frameIndex];
        frame = images[frameName] || images[item.spriteName];
      } else {
        const idleFrameName = config?.idleFrame || item.spriteName;
        frame = images[idleFrameName] || (Object.values(images)[0] as HTMLImageElement);
      }
      
      drawItemSprite(
        ctx,
        item.pos.x,
        item.pos.y,
        frame,
        (item.scale || 1.0) * spriteScale
      );
    });

    drawPixelSprite(ctx, player.pos.x, player.pos.y, player.dir, player.walkFrame, player.isSurfing, playerImages, undefined, player.bumpOffset, spriteScale, player.scale, player.isActionActive);
    
    const nearbyNPCResult = findNearbyNPC(npcsRef.current, player.pos, player.dir);
    const nearbyNPC = nearbyNPCResult ? nearbyNPCResult.npc : null;

    const nearbyItemResult = findNearbyItem(itemsRef.current, player.pos, player.dir);
    const nearbyItem = nearbyItemResult ? nearbyItemResult.item : null;

    const isNearbyNPC = !!nearbyNPC && nearbyNPC.type === EntityType.NPC;
    const isNearbyItem = !!nearbyItem;

    const shouldShowPrompt = 
        (isNearbyNPC && !currentState.hasInteractedWithNPC) || 
        (isNearbyItem && !currentState.hasInteractedWithItem);

    if (shouldShowPrompt && !currentState.isTalking) {
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 4;
        ctx.font = 'bold 14px font-mono';
        const text = nearbyNPC ? 'PRESS SPACE TO TALK' : 'PRESS SPACE TO PICK UP';
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
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <canvas
        ref={canvasRef}
        tabIndex={0}
        width={dimensions.width * (window.devicePixelRatio || 1)}
        height={dimensions.height * (window.devicePixelRatio || 1)}
        className="image-rendering-pixelated block w-full h-full outline-none transition-opacity duration-300"
        style={{ 
          imageRendering: 'pixelated',
        }}
      />
      {/* Map Transition Fade Overlay - Nested within the canvas container */}
      <AnimatePresence>
        {gameState.isTransitioning && (
          <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
            {gameState.transitionType === 'fade' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0 bg-black"
              />
            )}
            
            {gameState.transitionType === 'circle' && (
              <motion.div
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 80, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ 
                  duration: 0.4,
                  ease: "easeInOut"
                }}
                className="w-10 h-10 bg-black rounded-full origin-center"
              />
            )}

            {gameState.transitionType === 'flash' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
                className="absolute inset-0 bg-white"
              />
            )}
          </div>
        )}
      </AnimatePresence>
    </div>
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
        className="fixed top-4 left-4 md:top-8 md:left-8 z-[110] flex items-center gap-2 md:gap-3 px-3 py-2 md:px-6 md:py-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-all group shadow-2xl pointer-events-auto"
      >
        <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 group-hover:-translate-x-1 transition-transform" />
        <span className="hidden sm:inline text-[9px] md:text-[10px] font-black tracking-[2px] md:tracking-[3px] uppercase">jonalam.com</span>
      </a>

      {/* Mode Toggle Overlay - Always Visible */}
      <div className="fixed top-4 md:top-8 left-1/2 -translate-x-1/2 flex gap-1 z-[100] pointer-events-auto bg-black/40 backdrop-blur-xl border border-white/10 p-1 rounded-md md:p-1.5 md:rounded-full shadow-2xl">
        {(['none', 'gbc', 'gba'] as const).map(mode => (
          <button
            key={mode}
            onClick={(e) => {
              if (mode === overlayMode) return;
              setOverlayMode(mode);
              e.currentTarget.blur();
              canvasRef.current?.focus();
            }}
            className={`px-3 py-1.5 md:px-6 md:py-2 text-[8px] md:text-[9px] font-black tracking-[1px] md:tracking-[3px] rounded-sm md:rounded-full transition-all duration-300 ${
              overlayMode === mode 
                ? 'bg-white text-black shadow-[0_4px_12px_rgba(0,0,0,0.5)] scale-105' 
                : 'text-white/40 hover:text-white/80 hover:bg-white/5'
            }`}
          >
            {mode.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Map Switcher Toggle - For Testing */}
      <div className="fixed bottom-4 md:bottom-8 right-4 md:right-8 flex flex-col gap-2 z-[100] pointer-events-auto">
          <button
            onClick={(e) => {
              const currentIndex = TOGGLEABLE_MAPS.findIndex(m => m.id === gameState.currentMapId);
              const nextIndex = (currentIndex + 1) % TOGGLEABLE_MAPS.length;
              changeMap(TOGGLEABLE_MAPS[nextIndex].id, undefined, true);
              e.currentTarget.blur();
              canvasRef.current?.focus();
            }}
            className="group px-4 py-3 md:px-6 md:py-4 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl md:rounded-full text-white/50 hover:text-white transition-all shadow-2xl flex items-center gap-3 active:scale-95"
          >
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <div className="flex flex-col items-start leading-none">
              <span className="text-[7px] md:text-[8px] font-black tracking-[2px] text-white/30 uppercase mb-1">Current Map</span>
              <span className="text-[9px] md:text-[10px] font-black tracking-[3px] uppercase">{currentMap.name}</span>
            </div>
          </button>
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
            <NoOverlay 
              gameState={gameState}
              handleInteraction={handleInteraction}
              handleArrowDown={handleArrowDown}
              handleArrowUp={handleArrowUp}
            />
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
