import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { GameEngine } from './GameEngine';
import { NoOverlay } from './overlays/NoOverlay';
import { GBCOverlay } from './overlays/GBCOverlay';
import { GBAOverlay } from './overlays/GBAOverlay';
import { useAssets } from '../hooks/useAssets';
import { ITEM_SPRITE_CONFIGS, THROW_BALL_SPRITE_CONFIGS } from '../data/items';
import { TOGGLEABLE_MAPS } from '../data/maps';
import { CATCH_SUCCESS_SEQUENCE, CATCH_FAILURE_SEQUENCE, TILE_SIZE } from '../constants';
import { drawPixelSprite } from './SpriteRenderer';
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
    pokeballsRef,
    keysPressed,
    update,
    handleInteraction,
    handleThrow,
    handleArrowDown,
    handleArrowUp,
    changeMap,
    currentMap
  } = GameEngine();

  const updateRef = useRef(update);
  const drawRef = useRef<(ctx: CanvasRenderingContext2D) => void>(() => {});

  useEffect(() => {
    updateRef.current = update;
  }, [update]);

  const currentMapRef = useRef(currentMap);
  useEffect(() => {
    currentMapRef.current = currentMap;
  }, [currentMap]);

  useEffect(() => {
    displayedOverlayRef.current = displayedOverlayMode;
  }, [displayedOverlayMode]);

  useEffect(() => {
    let observedElement: HTMLElement = null;
    let observer: ResizeObserver = null;
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

  const calculateViewParams = (width: number, height: number, currentOverlay: string, mapConfig: any) => {
    const overlayConfig = mapConfig.overlays[currentOverlay];
    const totalMapWidth = overlayConfig.width * TILE_SIZE;
    const totalMapHeight = overlayConfig.height * TILE_SIZE;
    const isNone = currentOverlay === 'none';

    const isGBC = currentOverlay === 'gbc';
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

    const scale = isNone ? targetScale : Math.round(targetScale * 4) / 4;
    const logicalWidth = width / scale;
    const logicalHeight = height / scale;

    const player = playerRef.current;
    let targetCameraX = player.pos.x + TILE_SIZE / 2 - logicalWidth / 2;
    let targetCameraY = player.pos.y + TILE_SIZE / 2 - logicalHeight / 2;

    const maxCamX = Math.max(0, totalMapWidth - logicalWidth);
    const maxCamY = Math.max(0, totalMapHeight - logicalHeight);

    targetCameraX = Math.max(0, Math.min(targetCameraX, maxCamX));
    targetCameraY = Math.max(0, Math.min(targetCameraY, maxCamY));

    const offsetX = logicalWidth > totalMapWidth ? (logicalWidth - totalMapWidth) / 2 : 0;
    const offsetY = logicalHeight > totalMapHeight ? (logicalHeight - totalMapHeight) / 2 : 0;

    return { scale, targetCameraX, targetCameraY, offsetX, offsetY, totalMapWidth, totalMapHeight };
  };

  const collectRenderTasks = (ctx: CanvasRenderingContext2D, spriteScale: number) => {
    type RenderTask = { y: number; draw: () => void };
    const tasks: RenderTask[] = [];

    // 1. NPCs
    npcsRef.current.forEach(npc => {
      const isBeingCaptured = pokeballsRef.current.some(b => b.isCapturing && b.hitEntityId === npc.id);
      if (isBeingCaptured) return;

      tasks.push({
        y: npc.pos.y,
        draw: () => drawPixelSprite(
          ctx, npc.pos.x, npc.pos.y, npc.dir, npc.walkFrame || 0, npc.isSurfing || false, 
          npcImages, npc.spriteName, npc.bumpOffset, spriteScale, npc.scale, npc.isActionActive, npc.spriteSheet
        )
      });
    });

    // 2. Items
    itemsRef.current.forEach(item => {
      if (item.isCollected) return;
      const images = itemImages[item.spriteName];
      const config = ITEM_SPRITE_CONFIGS[item.spriteName];
      if (!images || !config?.isSheet) return;

      const sheetImg = images[config.frames[0]];
      if (!sheetImg) return;

      tasks.push({
        y: item.pos.y,
        draw: () => {
          let frameIndexStr = (item.isActionActive && item.actionFrame && config.actionSequence) 
            ? config.actionSequence[Math.min(item.actionFrame - 1, config.actionSequence.length - 1)]
            : config.idleFrame || '0';
          
          const frameIndex = parseInt(frameIndexStr);
          const sw = sheetImg.width / (config.sheetWidth || 1);
          const sh = sheetImg.height;
          const scale = (item.scale || 1.0) * spriteScale;
          const dw = sw * scale, dh = sh * scale;
          
          // 1px inset for spritesheets
          const sx = frameIndex * sw + 1, sy = 1, sWidth = Math.max(0, sw - 2), sHeight = Math.max(0, sh - 2);

          ctx.imageSmoothingEnabled = false;
          const xOffset = (dw - TILE_SIZE) / 2, yOffset = dh - TILE_SIZE;
          ctx.drawImage(sheetImg, sx, sy, sWidth, sHeight, Math.round(item.pos.x - xOffset), Math.round(item.pos.y - yOffset), dw, dh);
        }
      });
    });

    // 3. Player
    tasks.push({
      y: playerRef.current.pos.y,
      draw: () => drawPixelSprite(
        ctx, playerRef.current.pos.x, playerRef.current.pos.y, playerRef.current.dir, 
        playerRef.current.walkFrame, playerRef.current.isSurfing, playerImages, 
        undefined, playerRef.current.bumpOffset, spriteScale, playerRef.current.scale, playerRef.current.isActionActive
      )
    });

    // 4. Pokeballs
    pokeballsRef.current.forEach(ball => {
      tasks.push({
        y: ball.pos.y,
        draw: () => {
          const ballType = ball.ballType || 'pokeball';
          const images = itemImages[ballType];
          const config = THROW_BALL_SPRITE_CONFIGS[ballType] || ITEM_SPRITE_CONFIGS[ballType];
          const sheetImg = images?.[`${ballType}-sheet`];
          
          if (!images || !config?.isSheet || !sheetImg) {
            const ballImg = (images ? (images[ballType] || Object.values(images)[0]) : null) as HTMLImageElement;
            if (!ballImg) return;
            ctx.save();
            ctx.translate(ball.pos.x + TILE_SIZE / 2, ball.pos.y + TILE_SIZE / 2);
            ctx.rotate(ball.progress * Math.PI * 4);
            ctx.drawImage(ballImg, -12, -12, 24, 24);
            ctx.restore();
            return;
          }

          let frameIndex = ball.isCapturing 
            ? (ball.captureType === 'success' ? CATCH_SUCCESS_SEQUENCE : CATCH_FAILURE_SEQUENCE)[Math.floor(ball.captureFrame || 0)] || 0
            : 2;
            
          const sw = sheetImg.width / (config.sheetWidth || 1), sh = sheetImg.height;
          let sx = frameIndex * sw + 1, sy = 1, sWidth = sw - 2, sHeight = sh - 2;

          if (!ball.isCapturing) { sy = Math.max(0, sh - 16); sHeight = 16; }

          ctx.save();
          ctx.translate(ball.pos.x + TILE_SIZE / 2, ball.pos.y + TILE_SIZE / 2);
          if (!ball.isCapturing) ctx.rotate(ball.progress * Math.PI * 4);
          ctx.drawImage(sheetImg, sx, sy, sWidth, sHeight, -12, ball.isCapturing ? -12 * (sh/sw) : -12, 24, ball.isCapturing ? 24 * (sh/sw) : 24);
          ctx.restore();
        }
      });
    });

    return tasks;
  };

  const drawFloatingMessages = (ctx: CanvasRenderingContext2D) => {
    const delay = 1000;
    gameState.floatingMessages.forEach(msg => {
      const elapsed = Date.now() - msg.startTime;
      let alpha = 1, floatOffset = 0;

      if (elapsed > delay) {
        const progress = Math.min((elapsed - delay) / Math.max(msg.duration - delay, 1), 1);
        alpha = 1 - progress;
        floatOffset = progress * 30;
      }
      
      ctx.save();
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 4;
      ctx.font = 'bold 16px font-mono';
      ctx.textAlign = 'center';
      ctx.strokeText(msg.text, msg.pos.x + 16, msg.pos.y - 12 - floatOffset);
      ctx.fillText(msg.text, msg.pos.x + 16, msg.pos.y - 12 - floatOffset);
      ctx.restore();
    });
  };

  const drawInteractionPrompt = (ctx: CanvasRenderingContext2D) => {
    const player = playerRef.current;
    const currentState = stateRef.current;
    if (currentState.isTalking) return;

    const nearbyNPCResult = findNearbyNPC(npcsRef.current, player.pos, player.dir);
    const nearbyItemResult = findNearbyItem(itemsRef.current, player.pos, player.dir);

    const nearbyNPC = nearbyNPCResult?.npc;
    const nearbyItem = nearbyItemResult?.item;

    const isNearbyNPC = !!nearbyNPC && nearbyNPC.type === EntityType.NPC;
    const isNearbyItem = !!nearbyItem;

    const shouldShowPrompt = (isNearbyNPC && !currentState.hasInteractedWithNPC) || (isNearbyItem && !currentState.hasInteractedWithItem);

    if (shouldShowPrompt) {
      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 4;
      ctx.font = 'bold 14px font-mono';
      const text = nearbyNPC ? 'PRESS SPACE TO TALK' : 'PRESS SPACE TO PICK UP';
      const textWidth = ctx.measureText(text).width;
      ctx.strokeText(text, player.pos.x + 16 - textWidth/2, player.pos.y - 15);
      ctx.fillText(text, player.pos.x + 16 - textWidth/2, player.pos.y - 15);
    }
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    const { width, height } = dimensionsRef.current;
    if (width === 0 || height === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const currentOverlay = displayedOverlayRef.current;
    const mapConfig = currentMapRef.current;
    
    const { scale, targetCameraX, targetCameraY, offsetX, offsetY, totalMapWidth, totalMapHeight } = calculateViewParams(width, height, currentOverlay, mapConfig);
    
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, width * dpr, height * dpr);
    ctx.scale(dpr, dpr);

    ctx.save();
    ctx.translate(Math.round((offsetX - targetCameraX) * scale), Math.round((offsetY - targetCameraY) * scale));
    ctx.scale(scale, scale);

    // Draw Map
    const currentMapImage = mapImages[mapConfig.id];
    if (currentMapImage) {
      ctx.drawImage(currentMapImage, 0, 0, totalMapWidth, totalMapHeight);
    } else {
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, totalMapWidth, totalMapHeight);
    }

    // Y-Sorted Entities
    const spriteScale = mapConfig.spriteScaleMultiplier || 1;
    const renderTasks = collectRenderTasks(ctx, spriteScale);
    renderTasks.sort((a, b) => a.y - b.y);
    renderTasks.forEach(task => task.draw());

    // UI Overlays
    drawFloatingMessages(ctx);
    drawInteractionPrompt(ctx);

    ctx.restore();
  };


  useEffect(() => {
    drawRef.current = draw;
  }, [draw]);

  const loop = (time: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = time;
    const dt = time - lastTimeRef.current;
    lastTimeRef.current = time;

    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.imageSmoothingEnabled = false;
      updateRef.current(dt);
      drawRef.current(ctx);
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
              handleThrow={handleThrow}
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
                     handleThrow={handleThrow}
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
                     handleThrow={handleThrow}
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
