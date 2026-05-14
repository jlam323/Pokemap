import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CatchNotification } from '../../types';
import { POKEMON_NPC_BASES } from '../../data/pokemon';

interface NotificationBannerProps {
  notifications: CatchNotification[];
  onDismiss: () => void;
}

export const NotificationBanner = ({ notifications, onDismiss }: NotificationBannerProps) => {
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setImgSize({ w: img.width, h: img.height });
    img.src = '/pokemon/gen-1-overworld-pokemon.png';
  }, []);

  const current = notifications[0];

  useEffect(() => {
    if (!current) return;
    
    // Total duration: 2.5s for progress bar + 0.5s buffer for animation
    const timer = setTimeout(() => {
      onDismiss();
    }, 3000);

    return () => clearTimeout(timer);
  }, [current, onDismiss]);

  if (!current) return null;

  const pokemonData = POKEMON_NPC_BASES.find(p => p.spriteName === current.pokemonSprite);
  const spriteIndex = pokemonData?.spriteSheet?.index ?? 0;

  const getSpriteStyle = () => {
    if (!imgSize) return {};
    
    const spriteWidth = 32;
    const spriteHeight = 32;
    const spacing = 0.9;
    const inset = 1;
    const padding = 0;
    
    const blockWidth = spriteWidth * 2;
    const blockHeight = spriteHeight * 4;
    const columnsInSheet = Math.round((imgSize.w - padding + spacing) / (blockWidth + spacing));
    
    const blockX = padding + (spriteIndex % columnsInSheet) * (blockWidth + spacing);
    const blockY = padding + Math.floor(spriteIndex / columnsInSheet) * (blockHeight + spacing);
    
    const srcX = blockX + 0 * spriteWidth + inset; // Facing down neutral
    const srcY = blockY + 2 * spriteHeight + inset;
    const srcW = spriteWidth - 2 * inset;
    const srcH = spriteHeight - 2 * inset;

    const bgSizeW = (imgSize.w / srcW) * 100;
    const bgSizeH = (imgSize.h / srcH) * 100;
    const bgPosX = (srcX / (imgSize.w - srcW)) * 100;
    const bgPosY = (srcY / (imgSize.h - srcH)) * 100;
    
    return {
      backgroundImage: `url('/pokemon/gen-1-overworld-pokemon.png')`,
      backgroundSize: `${bgSizeW}% ${bgSizeH}%`,
      backgroundPosition: `${bgPosX}% ${bgPosY}%`,
      width: '100%',
      height: '100%',
      imageRendering: 'pixelated' as const,
    };
  };

  return (
    <AnimatePresence mode="wait">
      {current && (
        <motion.div
          key={current.pokemonSprite}
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 300, opacity: 0, transition: { duration: 0.3 } }}
          className="fixed top-4 right-4 z-[9999] flex items-center gap-4 bg-white/90 backdrop-blur-md border-4 border-black p-3 md:p-4 shadow-[8px_8px_0px_rgba(0,0,0,0.1)] max-w-[280px] md:max-w-xs"
        >
          <div className="absolute -top-4 -left-4 bg-black border-4 border-white px-3 py-1 rotate-[-5deg] shadow-[4px_4px_0px_rgba(0,0,0,1)]">
            <span className="text-yellow-400 font-black text-[12px] md:text-[16px] tracking-[3px] italic uppercase drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]">NEW</span>
          </div>

          <div className="w-16 h-16 md:w-20 md:h-20 bg-black/5 border-2 border-black flex items-center justify-center shrink-0">
            <div className="w-[90%] h-[90%]">
              {imgSize ? (
                <div style={getSpriteStyle()} />
              ) : (
                <div className="w-full h-full animate-pulse bg-black/10" />
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <h3 className="text-black font-black text-[14px] md:text-[18px] tracking-[1px] leading-none uppercase">
              {current.pokemonName}
            </h3>
            <span className="text-black/40 font-black text-[10px] md:text-[12px] tracking-[2px]">
              {current.pokedexNumber}
            </span>
            <div className="h-1 w-full bg-black/10 mt-1">
               <motion.div 
                 key={`${current.pokemonSprite}-progress`}
                 initial={{ width: 0 }}
                 animate={{ width: '100%' }}
                 transition={{ duration: 2.5, ease: "linear" }}
                 className="h-full bg-yellow-400"
               />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
