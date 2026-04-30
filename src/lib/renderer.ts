import { Direction } from '../types';

const PLAYER_SCALE = 1.75;
const NPC_SCALE = 1.5;
const SURF_SCALE_MODIFIER = 1.25;

export const drawPixelSprite = (
  ctx: CanvasRenderingContext2D, 
  rawX: number, 
  rawY: number, 
  color: string, 
  dir: Direction, 
  walkFrame: number = 0, 
  isSurfing: boolean = false,
  images?: Record<string, HTMLImageElement>,
  spriteName?: string
) => {
  const x = Math.round(rawX);
  const y = Math.round(rawY);
  const baseScale = spriteName ? NPC_SCALE : PLAYER_SCALE;
  const scale = isSurfing ? baseScale * SURF_SCALE_MODIFIER : baseScale;
  const size = 32 * scale;
  const offset = (size - 32) / 2;
  const yOffset = offset + 4; // Shift up by 4 pixels

  // If we have images, use them first
  if (images) {
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
      return;
    }
  }

  // Fallback to procedural sprites
  ctx.save();
  ctx.translate(x - offset, y - yOffset);
  ctx.scale(scale, scale);

  const bob = walkFrame % 2 === 1 ? -2 : 0;

  if (isSurfing) {
    // Draw Boat instead of Person (coordinates are now relative to 0,0 - 32,32)
    ctx.fillStyle = '#8b4513'; // Saddle brown
    ctx.beginPath();
    ctx.moveTo(2, 20);
    ctx.lineTo(30, 20);
    ctx.lineTo(24, 30);
    ctx.lineTo(8, 30);
    ctx.fill();
    
    // Mast
    ctx.fillStyle = '#5c4033';
    ctx.fillRect(15, 4, 2, 16);
    
    // Sail
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.moveTo(17, 4);
    ctx.lineTo(25, 12);
    ctx.lineTo(17, 18);
    ctx.fill();
    
    // Tiny head of player in boat
    ctx.fillStyle = color;
    ctx.fillRect(12, 14, 8, 8);
  } else {
    // Sprite Border for better visibility on green
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(2, 2 + bob, 28, 28);

    // Body
    ctx.fillStyle = color;
    ctx.fillRect(4, 4 + bob, 24, 24);
    
    // Head/Hair
    ctx.fillStyle = '#333';
    ctx.fillRect(4, bob, 24, 8);
    
    // Eyes
    ctx.fillStyle = 'white';
    if (dir === 'down') {
      ctx.fillRect(8, 10 + bob, 4, 4);
      ctx.fillRect(20, 10 + bob, 4, 4);
    } else if (dir === 'up') {
      // No eyes for back view usually
    } else if (dir === 'left') {
      ctx.fillRect(4, 10 + bob, 4, 4);
    } else if (dir === 'right') {
      ctx.fillRect(24, 10 + bob, 4, 4);
    }
    
    // Feet - Animation Logic
    ctx.fillStyle = '#111';
    if (walkFrame === 1) {
      // Left foot up
      ctx.fillRect(6, 26 + bob, 8, 4); 
      ctx.fillRect(18, 29 + bob, 8, 4);
    } else if (walkFrame === 2) {
      // Right foot up
      ctx.fillRect(6, 29 + bob, 8, 4);
      ctx.fillRect(18, 26 + bob, 8, 4);
    } else {
      // Both feet down
      ctx.fillRect(6, 29 + bob, 8, 4);
      ctx.fillRect(18, 29 + bob, 8, 4);
    }
  }
  ctx.restore();
};

export const drawTree = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
  // Trunk
  ctx.fillStyle = '#5c4033';
  ctx.fillRect(x + 12, y + 16, 8, 16);
  // Leaves
  ctx.fillStyle = '#2d5a27';
  ctx.fillRect(x, y, 32, 18);
  ctx.fillStyle = '#3a7233';
  ctx.fillRect(x + 4, y + 4, 24, 10);
};
