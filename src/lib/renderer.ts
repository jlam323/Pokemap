import { Direction } from '../types';

export const drawPixelSprite = (
  ctx: CanvasRenderingContext2D, 
  x: number, 
  y: number, 
  color: string, 
  dir: Direction, 
  walkFrame: number = 0, 
  isSurfing: boolean = false,
  playerImages?: Record<string, HTMLImageElement>
) => {
  // If we have images, use them first
  if (playerImages) {
    let spriteKey: string;
    
    if (isSurfing) {
      // Surfing has no neutral, uses 1 or 2
      const frame = walkFrame === 0 ? 1 : walkFrame; // Default to 1 if 0
      spriteKey = `surf-${dir}-${frame}`;
    } else {
      spriteKey = `neutral-${dir}`;
      if (walkFrame === 1) spriteKey = `walking-${dir}-1`;
      else if (walkFrame === 2) spriteKey = `walking-${dir}-2`;
    }
    
    // Enlarge walking player sprite
    const img = playerImages[spriteKey];
    if (img) {
      ctx.imageSmoothingEnabled = false;
      const baseScale = 1.75;
      const scale = isSurfing ? baseScale * 1.25 : baseScale;
      const size = 32 * scale;
      const offset = (size - 32) / 2;
      const yOffset = offset + 4; // Shift up by 4 pixels
      ctx.drawImage(img, x - offset, y - yOffset, size, size);
      return;
    }
  }

  // Fallback to procedural sprites
  const bob = walkFrame % 2 === 1 ? -2 : 0;

  if (isSurfing) {
    // Draw Boat instead of Person
    ctx.fillStyle = '#8b4513'; // Saddle brown
    ctx.beginPath();
    ctx.moveTo(x + 2, y + 20);
    ctx.lineTo(x + 30, y + 20);
    ctx.lineTo(x + 24, y + 30);
    ctx.lineTo(x + 8, y + 30);
    ctx.fill();
    
    // Mast
    ctx.fillStyle = '#5c4033';
    ctx.fillRect(x + 15, y + 4, 2, 16);
    
    // Sail
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.moveTo(x + 17, y + 4);
    ctx.lineTo(x + 25, y + 12);
    ctx.lineTo(x + 17, y + 18);
    ctx.fill();
    
    // Tiny head of player in boat
    ctx.fillStyle = color;
    ctx.fillRect(x + 12, y + 14, 8, 8);
    return;
  }

  // Sprite Border for better visibility on green
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(x + 2, y + 2 + bob, 28, 28);

  // Body
  ctx.fillStyle = color;
  ctx.fillRect(x + 4, y + 4 + bob, 24, 24);
  
  // Head/Hair
  ctx.fillStyle = '#333';
  ctx.fillRect(x + 4, y + bob, 24, 8);
  
  // Eyes
  ctx.fillStyle = 'white';
  if (dir === 'down') {
    ctx.fillRect(x + 8, y + 10 + bob, 4, 4);
    ctx.fillRect(x + 20, y + 10 + bob, 4, 4);
  } else if (dir === 'up') {
    // No eyes for back view usually
  } else if (dir === 'left') {
    ctx.fillRect(x + 4, y + 10 + bob, 4, 4);
  } else if (dir === 'right') {
    ctx.fillRect(x + 24, y + 10 + bob, 4, 4);
  }
  
  // Feet - Animation Logic
  ctx.fillStyle = '#111';
  if (walkFrame === 1) {
    // Left foot up
    ctx.fillRect(x + 6, y + 26 + bob, 8, 4); 
    ctx.fillRect(x + 18, y + 29 + bob, 8, 4);
  } else if (walkFrame === 2) {
    // Right foot up
    ctx.fillRect(x + 6, y + 29 + bob, 8, 4);
    ctx.fillRect(x + 18, y + 26 + bob, 8, 4);
  } else {
    // Both feet down
    ctx.fillRect(x + 6, y + 29 + bob, 8, 4);
    ctx.fillRect(x + 18, y + 29 + bob, 8, 4);
  }
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
