import { useRef, useCallback } from 'react';
import { Entity, Item } from '../types';

/**
 * Hook to manage the game's collision map.
 * 
 * It maintains a coordinate-based Set of occupied tiles to prevent entities
 * from overlapping or moving into blocked spaces. Coordinates are stored
 * in the format "x,y".
 * 
 * @returns {Object} contains the collisionMapRef and initCollisionMap function.
 */
export function useCollisionSystem() {
  const collisionMapRef = useRef<Set<string>>(new Set());

  /**
   * Initializes the collision map with the positions of the player, NPCs, and uncollected items.
   * 
   * @param player - The player entity
   * @param npcs - Array of current NPC entities
   * @param items - Array of current map items
   */
  const initCollisionMap = useCallback((player: Entity, npcs: Entity[], items: Item[]) => {
    const map = new Set<string>();
    map.add(`${player.pos.x},${player.pos.y}`);
    npcs.forEach(npc => {
      map.add(`${npc.pos.x},${npc.pos.y}`);
    });
    items.forEach(item => {
      if (!item.isCollected) {
        map.add(`${item.pos.x},${item.pos.y}`);
      }
    });
    collisionMapRef.current = map;
  }, []);

  return {
    collisionMapRef,
    initCollisionMap
  };
}
