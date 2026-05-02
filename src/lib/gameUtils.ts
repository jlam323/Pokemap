import { Position, Direction, Entity, Item } from '../types';
import { TILE_SIZE } from '../constants';

// Check if the entity is X tiles up/down/left/right
export function getInteractionTargetPos(pos: Position, dir: Direction, distance: number = 1): Position {
  const targetX = pos.x + (dir === 'left' ? -TILE_SIZE * distance : dir === 'right' ? TILE_SIZE * distance : 0);
  const targetY = pos.y + (dir === 'up' ? -TILE_SIZE * distance : dir === 'down' ? TILE_SIZE * distance : 0);
  return { x: targetX, y: targetY };
}

export function isAtPos(posA: Position, posB: Position): boolean {
  return Math.round(posA.x) === Math.round(posB.x) && Math.round(posA.y) === Math.round(posB.y);
}

export function findNearbyNPC(npcs: Entity[], playerPos: Position, playerDir: Direction): { npc: Entity, index: number } | null {
  // Check 1 cell away
  const target1 = getInteractionTargetPos(playerPos, playerDir, 1);
  const idx1 = npcs.findIndex(npc => isAtPos(npc.pos, target1));
  if (idx1 !== -1) return { npc: npcs[idx1], index: idx1 };

  // Check 2 cells away for shopkeepers
  const target2 = getInteractionTargetPos(playerPos, playerDir, 2);
  const idx2 = npcs.findIndex(npc => npc.npcType === 'shopkeeper' && isAtPos(npc.pos, target2));
  if (idx2 !== -1) return { npc: npcs[idx2], index: idx2 };

  return null;
}

export function findNearbyItem(items: Item[], playerPos: Position, playerDir: Direction): { item: Item, index: number } | null {
  const target = getInteractionTargetPos(playerPos, playerDir, 1);
  const idx = items.findIndex(item => !item.isCollected && isAtPos(item.pos, target));
  if (idx !== -1) return { item: items[idx], index: idx };
  return null;
}
