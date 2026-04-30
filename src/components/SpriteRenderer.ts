import { Direction } from '../types';
import { NPC_SPRITE_CONFIGS, DEFAULT_NPC_SCALE } from '../data/npcs';
import { PLAYER_SCALE, SURF_SCALE_MODIFIER } from '../data/player';

export const drawPixelSprite = (
  ctx: CanvasRenderingContext2D, 
  rawX: number, 
  rawY: number, 
  dir: Direction, 
  walkFrame: number = 0, 
  isSurfing: boolean = false,
  images?: Record<string, HTMLImageElement>,
  spriteName?: string
 ) => {
  const x = Math.round(rawX);
  const y = Math.round(rawY);
  // If we have images, use them first
  if (images) {
    const baseScale = spriteName ? (NPC_SPRITE_CONFIGS[spriteName]?.scale || DEFAULT_NPC_SCALE) : PLAYER_SCALE;
    const scale = isSurfing ? baseScale * SURF_SCALE_MODIFIER : baseScale;
    const size = 32 * scale;
    
    let spriteKey: string;
    
    if (isSurfing) {
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
    
    const img = images[spriteKey];
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
