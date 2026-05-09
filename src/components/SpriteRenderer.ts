import { Direction } from '../types';
import { NPC_SPRITE_CONFIGS, DEFAULT_NPC_SCALE } from '../data/npcs';
import { PLAYER_SCALE, SURF_SCALE_MODIFIER } from '../data/player';
import { TILE_SIZE, SPRITE_SHEET_DEFAULTS } from '../constants';

export const drawPixelSprite = (
  ctx: CanvasRenderingContext2D, 
  rawX: number, 
  rawY: number, 
  dir: Direction, 
  walkFrame: number = 0, 
  isSurfing: boolean = false,
  images?: Record<string, any>,
  spriteName?: string,
  bumpOffset?: { x: number, y: number },
  scaleMultiplier: number = 1,
  entityScale?: number,
  isActionActive: boolean = false,
  spriteSheet?: {
    name: string;
    index: number;
    spriteWidth: number;
    spriteHeight: number;
    padding?: number;
    spacing?: number;
    inset?: number;
  }
 ) => {
  const x = Math.round(rawX + (bumpOffset?.x || 0));
  const y = Math.round(rawY + (bumpOffset?.y || 0));
  
  // Handle Sprite Sheets
  if (images && spriteSheet && images['_sheets']?.[spriteSheet.name]) {
    drawSheetSprite(
      ctx,
      images['_sheets'][spriteSheet.name],
      spriteSheet,
      x,
      y,
      dir,
      walkFrame,
      scaleMultiplier,
      entityScale,
      spriteName
    );
    return;
  }

  // If we have images, use them first
  if (images) {
    const spriteImages = spriteName ? images[spriteName] : images;
    if (!spriteImages) return;

    let scaleBaseValue = PLAYER_SCALE;
    if (spriteName) {
      scaleBaseValue = entityScale || NPC_SPRITE_CONFIGS[spriteName]?.scale || (spriteImages[spriteName] ? 1 : DEFAULT_NPC_SCALE);
    }
    const baseScale = scaleBaseValue * scaleMultiplier;
    const scale = isSurfing ? baseScale * SURF_SCALE_MODIFIER : baseScale;
    const size = 32 * scale;
    
    let spriteKey: string;
    
    if (spriteImages[spriteName || '']) {
      spriteKey = spriteName || '';
    } else if (isActionActive && spriteName) {
      spriteKey = `${spriteName}-action`;
    } else if (isSurfing) {
      // Surfing has no neutral, uses 1 or 2
      const frame = walkFrame === 0 ? 1 : walkFrame; // Default to 1 if 0
      spriteKey = `surf-${dir}-${frame}`;
    } else if (spriteName) {
      // NPC naming convention: [spriteName]-neutral-[dir] or [spriteName]-walk-[dir]
      const isWalking = walkFrame > 0;
      const state = isWalking ? 'walk' : 'neutral';
      spriteKey = `${spriteName}-${state}-${dir}`;
    } else {
      spriteKey = `neutral-${dir}`;
      if (walkFrame === 1) spriteKey = `walking-${dir}-1`;
      else if (walkFrame === 2) spriteKey = `walking-${dir}-2`;
    }
    
    const img = spriteImages[spriteKey];
    if (img) {
      ctx.imageSmoothingEnabled = false;
      
      // Calculate dimensions maintaining aspect ratio, based on size being the target height
      const aspectRatio = img.width / img.height;
      const displayHeight = size;
      const displayWidth = displayHeight * aspectRatio;
      
      // Calculate offsets based on actual display dimensions
      const xOffset = (displayWidth - 32) / 2;
      const yOffsetInner = (displayHeight - 32) / 2 + 4; // Shift up by 4 pixels
      
      ctx.drawImage(img, x - xOffset, y - yOffsetInner, displayWidth, displayHeight);
    }
  }
};

const drawSheetSprite = (
  ctx: CanvasRenderingContext2D,
  sheetImg: HTMLImageElement,
  sheetConfig: { name: string; index: number; spriteWidth?: number; spriteHeight?: number; padding?: number; spacing?: number; inset?: number },
  x: number,
  y: number,
  dir: Direction,
  walkFrame: number,
  scaleMultiplier: number,
  entityScale?: number,
  spriteName?: string
) => {
  const defaults = SPRITE_SHEET_DEFAULTS[sheetConfig.name] || { padding: 0, spacing: 0, inset: 0, defaultWidth: 32, defaultHeight: 32 };
  const { 
    index, 
    spriteWidth = defaults.defaultWidth || 32, 
    spriteHeight = defaults.defaultHeight || 32, 
    padding = defaults.padding, 
    spacing = defaults.spacing,
    inset = defaults.inset || 0
  } = sheetConfig;
  
  // Each entity block is 2 columns x 4 rows
  const blockWidth = spriteWidth * 2;
  const blockHeight = spriteHeight * 4;

  const columnsInSheet = Math.round((sheetImg.width - padding + spacing) / (blockWidth + spacing));
  const blockX = padding + (index % columnsInSheet) * (blockWidth + spacing);
  const blockY = padding + Math.floor(index / columnsInSheet) * (blockHeight + spacing);

  // Calculate local sprite offset within the 2x4 block
  // Pattern: [[up-1, left-1], [up-2, left-2], [down-1, right-1], [down-2, right-2]]
  let localX = 0;
  let localY = 0;
  const frame = walkFrame === 0 ? 0 : walkFrame - 1; // 0 or 1

  if (dir === 'up') {
    localX = 0;
    localY = frame;
  } else if (dir === 'left') {
    localX = 1;
    localY = frame;
  } else if (dir === 'down') {
    localX = 0;
    localY = 2 + frame;
  } else if (dir === 'right') {
    localX = 1;
    localY = 2 + frame;
  }

  const srcX = blockX + localX * spriteWidth + inset;
  const srcY = blockY + localY * spriteHeight + inset;
  const srcW = spriteWidth - 2 * inset;
  const srcH = spriteHeight - 2 * inset;

  const scale = entityScale || NPC_SPRITE_CONFIGS[spriteName || '']?.scale || DEFAULT_NPC_SCALE;
  const size = srcH * scale * scaleMultiplier;
  const displayWidth = srcW * scale * scaleMultiplier;
  
  const xOffset = (displayWidth - 32) / 2;
  const yOffsetInner = (size - 32) / 2 + 4;

  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    sheetImg,
    srcX, srcY, srcW, srcH,
    x - xOffset, y - yOffsetInner, displayWidth, size
  );
};

export const drawItemSprite = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  image?: HTMLImageElement,
  scale: number = 1
) => {
  if (!image) return;

  const width = image.width * scale;
  const height = image.height * scale;

  // Center horizontally within 32px tile
  const xOffset = (width - TILE_SIZE) / 2;
  // Align bottom of sprite with bottom of 32px tile
  const yOffset = height - TILE_SIZE;

  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(image, Math.round(x - xOffset), Math.round(y - yOffset), width, height);
};
