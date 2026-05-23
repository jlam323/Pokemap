import React from 'react';
import { TYPE_MOVES } from '../../constants';
import { POKEMON_NPC_BASES } from '../../data/pokemon';

export function getMovesForPokemon(data: typeof POKEMON_NPC_BASES[number] | null | undefined) {
  // Fail safe move list
  if (!data || !data.battleTypes || data.battleTypes.length === 0) {
    return ['TACKLE', 'SCRATCH', 'GROWL'];
  }
  
  const types = data.battleTypes;
  
  if (types.length === 1) {
    const typeMoves = TYPE_MOVES[types[0]];
    return [...typeMoves].slice(0, 3);
  }
  
  // 2 types: 2 from first, 1 from second
  const type1Moves = TYPE_MOVES[types[0]];
  const type2Moves = TYPE_MOVES[types[1]];
  
  return [
    type1Moves[0],
    type1Moves[1],
    type2Moves[0]
  ];
}

export function getPokeballStyle(
  ballType: string,
  phaseOrFrameIndex: 'thrown' | 'landed' | number,
  itemImages: Record<string, Record<string, HTMLImageElement>>,
  forcedTallCrop?: boolean
): React.CSSProperties {
  const images = itemImages[ballType];
  const sheetImg = images?.[`${ballType}-sheet`];
  if (!sheetImg) return {};

  const totalFrames = 13;
  let isLanded: boolean;
  let frameIndex: number;
  let useTallCrops: boolean;

  if (typeof phaseOrFrameIndex === 'string') {
    isLanded = phaseOrFrameIndex === 'landed';
    frameIndex = isLanded ? 1 : 2; // Frame index 2 is closed, 1 is open
    useTallCrops = isLanded;
  } else {
    frameIndex = phaseOrFrameIndex;
    useTallCrops = forcedTallCrop ?? false;
  }
  
  const sw = sheetImg.naturalWidth / totalFrames;
  const sh = sheetImg.naturalHeight;
  
  // GameCanvas logic: non-capturing balls use 16px high bottom crop
  // Landed balls (opening) use the full frame (sh - 2)
  const sWidth = sw - 2;
  const sHeight = useTallCrops ? sh - 2 : 16;
  const sy = useTallCrops ? 1 : Math.max(0, sh - 16);
  const sx = frameIndex * sw + 1;

  const bgSizeW = (sheetImg.naturalWidth / sWidth) * 100;
  const bgSizeH = (sheetImg.naturalHeight / sHeight) * 100;
  
  // Correctly calculate position based on the visible crop
  const bgPosX = (sx / (sheetImg.naturalWidth - sWidth)) * 100;
  const bgPosY = (sy / (sheetImg.naturalHeight - sHeight)) * 100;

  const baseSize = 24;
  const calculatedWidth = baseSize;
  const calculatedHeight = Math.round(baseSize * (sHeight / sWidth));

  return {
    backgroundImage: `url('${sheetImg.src}')`,
    backgroundSize: `${bgSizeW}% ${bgSizeH}%`,
    backgroundPosition: `${bgPosX}% ${bgPosY}%`,
    imageRendering: 'pixelated',
    width: `${calculatedWidth}px`,
    height: `${calculatedHeight}px`,
  };
}

export function getSpriteStyle(
  index: number,
  pokemonSheet: HTMLImageElement | undefined,
  localX: number = 0,
  localY: number = 2
): React.CSSProperties {
  if (!pokemonSheet) return {};
  
  const imgW = pokemonSheet.naturalWidth;
  const imgH = pokemonSheet.naturalHeight;
  const spriteWidth = 32;
  const spriteHeight = 32;
  const spacing = 0.9;
  const inset = 1;
  const padding = 0;
  
  const blockWidth = spriteWidth * 2;
  const blockHeight = spriteHeight * 4;
  const columnsInSheet = Math.round((imgW - padding + spacing) / (blockWidth + spacing));
  
  const blockX = padding + (index % columnsInSheet) * (blockWidth + spacing);
  const blockY = padding + Math.floor(index / columnsInSheet) * (blockHeight + spacing);
  
  const srcX = blockX + localX * spriteWidth + inset;
  const srcY = blockY + localY * spriteHeight + inset;
  const srcW = spriteWidth - 2 * inset;
  const srcH = spriteHeight - 2 * inset;

  const bgSizeW = (imgW / srcW) * 100;
  const bgSizeH = (imgH / srcH) * 100;
  const bgPosX = (srcX / (imgW - srcW)) * 100;
  const bgPosY = (srcY / (imgH - srcH)) * 100;
  
  return {
    backgroundImage: `url('${pokemonSheet.src}')`,
    backgroundSize: `${bgSizeW}% ${bgSizeH}%`,
    backgroundPosition: `${bgPosX}% ${bgPosY}%`,
    imageRendering: 'pixelated',
  };
}
