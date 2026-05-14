import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { POKEMON_NPC_BASES } from '../../data/pokemon';
import { TYPE_COLORS } from '../../constants';

interface PokedexViewProps {
  caughtIds: string[];
  onBack: () => void;
  overlayMode: 'none' | 'gbc' | 'gba';
}

export const PokedexView = ({ caughtIds = [], onBack, overlayMode }: PokedexViewProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);
  const [itemsPerRow, setItemsPerRow] = useState(6);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    // Scroll the selected item into view
    const selectedElement = itemRefs.current[selectedIndex];
    if (selectedElement && scrollContainerRef.current) {
      selectedElement.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest'
      });
    }
  }, [selectedIndex]);

  useEffect(() => {
    const updateItemsPerRow = () => {
      const width = window.innerWidth;
      if (width < 640) setItemsPerRow(6);
      else if (width < 1024) setItemsPerRow(10);
      else setItemsPerRow(15);
    };

    updateItemsPerRow();
    window.addEventListener('resize', updateItemsPerRow);
    return () => window.removeEventListener('resize', updateItemsPerRow);
  }, []);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setImgSize({ w: img.width, h: img.height });
    img.src = '/pokemon/gen-1-overworld-pokemon.png';
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      if (!POKEMON_NPC_BASES || POKEMON_NPC_BASES.length === 0) return;

      const isSelectionKey = key === 'Enter' || key === ' ' || key === 'z' || key === 'Space';
      const isBackKey = key === 'Escape' || key === 'x' || key === 'Backspace' || key === 'p' || key === 'f';
      const isUpKey = key === 'ArrowUp' || key === 'w';
      const isDownKey = key === 'ArrowDown' || key === 's';
      const isLeftKey = key === 'ArrowLeft' || key === 'a';
      const isRightKey = key === 'ArrowRight' || key === 'd';
      
      if (isRightKey) {
        setSelectedIndex(prev => Math.min(prev + 1, POKEMON_NPC_BASES.length - 1));
      } else if (isLeftKey) {
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (isDownKey) {
        setSelectedIndex(prev => Math.min(prev + itemsPerRow, POKEMON_NPC_BASES.length - 1));
      } else if (isUpKey) {
        setSelectedIndex(prev => Math.max(prev - itemsPerRow, 0));
      } else if (isBackKey) {
        onBack();
      } else if (isSelectionKey) {
        // Handle selection if needed
        console.log('Selected:', selectedPokemon.name);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [itemsPerRow]);

  const selectedPokemon = POKEMON_NPC_BASES[selectedIndex];
  
  if (!POKEMON_NPC_BASES || POKEMON_NPC_BASES.length === 0) {
    return (
      <div className="bg-white border-4 border-black p-10 flex flex-col items-center gap-4">
        <h2 className="text-black font-black">POKÉDEX UNAVAILABLE</h2>
        <button onClick={onBack} className="bg-black text-white px-4 py-2 text-xs font-black">GO BACK</button>
      </div>
    );
  }

  if (!selectedPokemon) {
    return (
       <div className="bg-white border-4 border-black p-10 flex flex-col items-center gap-4">
        <h2 className="text-black font-black text-center">SELECTED POKÉMON ERROR ({selectedIndex})</h2>
        <button onClick={onBack} className="bg-black text-white px-4 py-2 text-xs font-black">GO BACK</button>
      </div>
    );
  }

  const isCaught = (caughtIds || []).includes(selectedPokemon.spriteName);

  // Helper to get responsive font sizes based on overlay mode
  const getFontSize = (baseSize: string, largeSize: string) => {
    if (overlayMode !== 'none') return baseSize; // Force small on overlays
    return `${largeSize} md:${baseSize}`;
  };

  const getSpriteStyle = (index: number, caught: boolean) => {
    if (!imgSize) return {};
    
    // Standard sprite constants
    const spriteWidth = 32;
    const spriteHeight = 32;
    const spacing = 0.9;
    const inset = 1;
    const padding = 0;
    
    const blockWidth = spriteWidth * 2;
    const blockHeight = spriteHeight * 4;
    const columnsInSheet = Math.round((imgSize.w - padding + spacing) / (blockWidth + spacing));
    
    const blockX = padding + (index % columnsInSheet) * (blockWidth + spacing);
    const blockY = padding + Math.floor(index / columnsInSheet) * (blockHeight + spacing);
    
    // We want localX=0, localY=2 (Facing down neutral)
    const localX = 0;
    const localY = 2;
    
    const srcX = blockX + localX * spriteWidth + inset;
    const srcY = blockY + localY * spriteHeight + inset;
    const srcW = spriteWidth - 2 * inset;
    const srcH = spriteHeight - 2 * inset;

    // Percentage logic:
    // This allows the sprite to be responsive to its container size
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
      filter: caught ? 'none' : 'grayscale(1) brightness(0.2)',
    };
  };

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className="bg-white border-4 border-black w-full h-[95%] md:h-[90%] max-w-4xl flex flex-col shadow-[8px_8px_0px_rgba(0,0,0,0.2)] overflow-hidden"
    >
      <div className="bg-black p-2 md:p-3 flex justify-between items-center shrink-0">
        <span className={`text-white font-black tracking-[4px] ${getFontSize('text-[12px]', 'text-[14px]')}`}>POKÉDEX</span>
        <div className="flex gap-2">
          <span className={`text-white/40 font-bold tracking-[1px] uppercase ${getFontSize('text-[7px]', 'text-[12px]')}`}>Caught: {caughtIds.length}</span>
        </div>
      </div>

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-1 scrollbar-hide bg-[#f0f0f0]">
        <div 
          className="grid gap-0.5" 
          style={{ gridTemplateColumns: `repeat(${itemsPerRow}, minmax(0, 1fr))` }}
        >
          {POKEMON_NPC_BASES.map((pokemon, i) => {
            const caught = (caughtIds || []).includes(pokemon.spriteName);
            const selected = selectedIndex === i;
            
            return (
              <div
                key={pokemon.id}
                ref={el => itemRefs.current[i] = el}
                onClick={() => setSelectedIndex(i)}
                className={`aspect-square border flex items-center justify-center relative overflow-hidden transition-all cursor-pointer ${
                  selected ? 'border-black bg-white z-10 shadow-lg' : 'border-transparent bg-black/5 hover:bg-black/10'
                }`}
              >
                {!caught && <div className="absolute inset-0 bg-black/10 z-0" />}
                
                <div className="w-[85%] h-[85%] flex items-center justify-center">
                  {imgSize ? (
                    <div style={getSpriteStyle(pokemon.spriteSheet.index, caught)} />
                  ) : (
                    <div className="w-1 h-1 bg-black/10 animate-pulse" />
                  )}
                </div>
                
                {selected && (
                  <div className={`absolute bottom-0 left-0 right-0 bg-black text-white font-black tracking-[1px] text-center py-0.5 uppercase z-20 ${getFontSize('text-[7px]', 'text-[6px]')}`}>
                    {caught ? pokemon.name : '???'}
                  </div>
                )}
                
                {caught && (
                  <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-green-500 border border-black transform translate-x-1/2 -translate-y-1/2 rotate-45 z-20" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-2 md:p-3 bg-white border-t-4 border-black shrink-0">
        <div className="flex items-center gap-3 md:gap-4">
          <div className={`w-12 h-12 md:w-16 md:h-16 border-2 border-black flex items-center justify-center shrink-0 ${isCaught ? 'bg-white' : 'bg-black/5'}`}>
            <div className="w-[90%] h-[90%]">
              {imgSize && (
                <div style={getSpriteStyle(selectedPokemon.spriteSheet.index, isCaught)} />
              )}
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className={`font-black tracking-[2px] ${getFontSize('text-[13px]', 'text-[16px]')}`}>{isCaught ? selectedPokemon.name : `??? (No. ${(selectedIndex + 1).toString().padStart(3,'0')})`}</span>
              {isCaught && selectedPokemon.battleTypes && selectedPokemon.battleTypes.length > 0 && (
                <div className="flex gap-1 mt-0.5">
                  {selectedPokemon.battleTypes.map(type => (
                    <span 
                      key={type} 
                      className={`${TYPE_COLORS[type] || 'bg-gray-400'} text-white text-[6px] md:text-[8px] px-2 py-0.5 rounded font-black tracking-[1px] uppercase border border-black/20 shadow-sm`}
                    >
                      {type}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <p className={`font-bold text-black/50 tracking-[1px] mt-1 leading-relaxed ${getFontSize('text-[10px]', 'text-[14px]')}`}>
              {isCaught ? 'THIS POKÉMON HAS BEEN SUCCESSFULLY CAPTURED AND DOCUMENTED.' : 'NOT MUCH IS KNOWN ABOUT THIS POKÉMON YET. CAPTURE IT TO LEARN MORE.'}
            </p>
          </div>
        </div>
        <div className="mt-1 md:mt-2 flex justify-end">
            <span className={`font-black tracking-[2px] text-black/30 ${getFontSize('text-[8px]', 'text-[11px]')}`}>[B] TO BACK</span>
        </div>
      </div>
    </motion.div>
  );
};
