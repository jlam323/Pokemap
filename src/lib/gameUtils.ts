import { Position, Direction, Entity, Item, NPCType } from '../types';
import { TILE_SIZE } from '../constants';

// Check if the entity is X tiles up/down/left/right
/**
 * Calculates the target coordinate for an interaction based on direction and distance.
 * 
 * @param pos - Starting position
 * @param dir - Direction facing
 * @param distance - Distance in tiles
 * @returns {Position} The computed target position in pixels
 */
export function getInteractionTargetPos(pos: Position, dir: Direction, distance: number = 1): Position {
  const targetX = pos.x + (dir === 'left' ? -TILE_SIZE * distance : dir === 'right' ? TILE_SIZE * distance : 0);
  const targetY = pos.y + (dir === 'up' ? -TILE_SIZE * distance : dir === 'down' ? TILE_SIZE * distance : 0);
  return { x: targetX, y: targetY };
}

/**
 * Snaps a pixel coordinate position to the nearest tile grid position.
 * 
 * @param pos - Pixel position
 * @returns {Position} Snapped position aligned to tile size
 */
export function toGridPos(pos: Position): Position {
  return {
    x: Math.round(pos.x / TILE_SIZE) * TILE_SIZE,
    y: Math.round(pos.y / TILE_SIZE) * TILE_SIZE
  };
}

/**
 * Converts a position to a unique string key formatted as "x,y" snapped to tile grid boundaries.
 * 
 * @param pos - Pixel position
 * @returns {string} Grid coordinate string key
 */
export function toGridKey(pos: Position): string {
  const g = toGridPos(pos);
  return `${g.x},${g.y}`;
}

/**
 * Checks if two positions refer to the same tile on the grid.
 * 
 * @param posA - First position
 * @param posB - Second position
 * @returns {boolean} True if positions round to the same tile grid coordinates
 */
export function isAtPos(posA: Position, posB: Position): boolean {
  const gA = toGridPos(posA);
  const gB = toGridPos(posB);
  return gA.x === gB.x && gA.y === gB.y;
}

/**
 * Searches for an NPC that the player is currently facing.
 * Standard NPCs are checked 1 tile away; Shopkeepers/NPCs behind counters are checked up to 2 tiles away.
 * Checks current, start, and target positions for moving entities.
 * 
 * @param npcs - Array of current NPC entities
 * @param playerPos - Player's current position
 * @param playerDir - Player's current facing direction
 * @returns {Object|null} The found NPC and its index, or null
 */
export function findNearbyNPC(npcs: Entity[], playerPos: Position, playerDir: Direction): { npc: Entity, index: number } | null {
  // Check 1 cell away
  const target1 = getInteractionTargetPos(playerPos, playerDir, 1);
  const idx1 = npcs.findIndex(npc => {
    if (isAtPos(npc.pos, target1)) return true;
    if (npc.startPos && isAtPos(npc.startPos, target1)) return true;
    if (npc.targetPos && isAtPos(npc.targetPos, target1)) return true;
    return false;
  });
  if (idx1 !== -1) return { npc: npcs[idx1], index: idx1 };

  // Check 2 cells away for shopkeepers
  const target2 = getInteractionTargetPos(playerPos, playerDir, 2);
  const idx2 = npcs.findIndex(npc => {
    if (npc.npcType !== NPCType.SHOPKEEPER) return false;
    if (isAtPos(npc.pos, target2)) return true;
    if (npc.startPos && isAtPos(npc.startPos, target2)) return true;
    if (npc.targetPos && isAtPos(npc.targetPos, target2)) return true;
    return false;
  });
  if (idx2 !== -1) return { npc: npcs[idx2], index: idx2 };

  return null;
}

/**
 * Searches for an item 1 tile in front of the player.
 * 
 * @param items - Array of current map items
 * @param playerPos - Player's current position
 * @param playerDir - Player's current facing direction
 * @returns {Object|null} The found Item and its index, or null
 */
export function findNearbyItem(items: Item[], playerPos: Position, playerDir: Direction): { item: Item, index: number } | null {
  const target = getInteractionTargetPos(playerPos, playerDir, 1);
  const idx = items.findIndex(item => !item.isCollected && isAtPos(item.pos, target));
  if (idx !== -1) return { item: items[idx], index: idx };
  return null;
}
